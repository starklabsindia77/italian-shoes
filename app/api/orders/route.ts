import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAuth } from "@/lib/api-helpers";
import { OrderCreateSchema } from "@/lib/validators";
import { getS3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "@/lib/email-service";
import { getRazorpayCredentials, verifyPaymentSignature } from "@/lib/razorpay";
import { getCashfreeCredentials, fetchCashfreeOrder, CashfreeError } from "@/lib/cashfree";
import { quoteCart, toMinorUnits, PricingError, BASE_CURRENCY } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

async function uploadBase64ToS3(base64Data: string, folder: string = "designs") {
  if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

  try {
    const [meta, data] = base64Data.split(",");
    const extension = meta.split(";")[0].split("/")[1] || "png";
    const buffer = Buffer.from(data, "base64");
    const fileName = `${uuidv4()}.${extension}`;
    const s3Key = `${folder}/${fileName}`;
    const s3Client = getS3Client();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: meta.split(";")[0].split(":")[1] || "image/png",
      })
    );

    return `/${s3Key}`;
  } catch (error) {
    console.error("Base64 S3 Upload Error:", error);
    return base64Data; // Fallback to base64 if upload fails
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const u = session.user as { id?: string; email: string; role: string; permissions?: string[] };
    const sp = getSearchParams(req);
    const email = sp.get("email") ?? undefined;
    const customerId = sp.get("customerId") ?? undefined;

    const hasOrderView = u.role === "ADMIN" || u.permissions?.includes("orders.view");
    if (!hasOrderView) {
      // Without the permission a user may only list their own orders.
      if (!email || email.toLowerCase() !== u.email.toLowerCase()) {
        return bad("Forbidden", 403);
      }
    }

    const status = sp.get("status") ?? undefined;
    const { skip, limit } = pagination(req);

    const where: Prisma.OrderWhereInput = {};
    if (email) where.customerEmail = email;
    // Supported so the customer detail page can scope to one customer; without
    // it that page received every order in the system.
    if (customerId) where.customerId = customerId;
    if (status && status !== "all") {
      where.status = status.toUpperCase() as Prisma.OrderWhereInput["status"];
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.order.count({ where })
    ]);

    const mappedItems = items.map(o => ({
      ...o,
      status: o.status.toLowerCase(),
      paymentStatus: o.paymentStatus.toLowerCase(),
      fulfillmentStatus: o.fulfillmentStatus.toLowerCase(),
      customerName: [o.customerFirstName, o.customerLastName].filter(Boolean).join(" ") || "Guest"
    }));
    return ok({ items: mappedItems, total, limit });
  } catch (e) { return server(e); }
}

type VerifiedPayment = { gatewayOrderId: string; chargedMinor: number };
type OrderInput = z.infer<typeof OrderCreateSchema>;

/**
 * Razorpay: the checkout callback is HMAC-signed with the API secret, so verify
 * the signature, then read the authorised amount back from Razorpay.
 */
async function verifyRazorpay(d: OrderInput): Promise<VerifiedPayment | Response> {
  const credentials = await getRazorpayCredentials();
  if (!credentials) return bad("Razorpay is not configured; cannot verify payment.", 503);

  // Presence is guaranteed by OrderCreateSchema's refinement.
  const razorpayOrderId = d.razorpayOrderId!;
  const signatureValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId: d.razorpayPaymentId!,
    signature: d.razorpaySignature!,
    keySecret: credentials.keySecret,
  });
  if (!signatureValid) {
    console.warn("orders/rejected-signature", { razorpayOrderId });
    return bad("Payment could not be verified.", 400);
  }

  const RazorpayCtor = (await import("razorpay")).default;
  const razorpay = new RazorpayCtor({ key_id: credentials.keyId, key_secret: credentials.keySecret });
  const remoteOrder = await razorpay.orders.fetch(razorpayOrderId);
  return { gatewayOrderId: razorpayOrderId, chargedMinor: Number(remoteOrder.amount) };
}

/**
 * Cashfree: the browser-side result is not signed, so ask Cashfree directly —
 * with our secret — whether the order is PAID and for how much.
 */
async function verifyCashfree(d: OrderInput): Promise<VerifiedPayment | Response> {
  const credentials = await getCashfreeCredentials();
  if (!credentials) return bad("Cashfree is not configured; cannot verify payment.", 503);

  const cashfreeOrderId = d.cashfreeOrderId!;
  const remoteOrder = await fetchCashfreeOrder(credentials, cashfreeOrderId);
  if (remoteOrder.order_status !== "PAID" || remoteOrder.order_currency !== BASE_CURRENCY) {
    console.warn("orders/cashfree-unpaid", {
      cashfreeOrderId,
      status: remoteOrder.order_status,
      currency: remoteOrder.order_currency,
    });
    return bad("Payment has not been completed.", 402);
  }
  return {
    gatewayOrderId: remoteOrder.order_id,
    chargedMinor: toMinorUnits(Number(remoteOrder.order_amount)),
  };
}

/**
 * No online payment: allowed only when the store's configured gateway really
 * is "none" — otherwise a client could skip paying just by sending
 * paymentGateway: "none". The order is recorded as payment-PENDING, so it is
 * never mistaken for a paid one.
 */
async function acceptUnpaid(): Promise<{ gatewayOrderId: string } | Response> {
  const settings = await getSettings();
  if (settings.integrations?.paymentGateway !== "none") {
    return bad("Online payment is required for this store.", 402);
  }
  return { gatewayOrderId: `manual_${uuidv4()}` };
}

/**
 * Records an order after a Razorpay or Cashfree payment, or — when the store
 * runs without a payment gateway — as an unpaid order.
 *
 * Two things are deliberately NOT taken from the request body:
 *   1. the payment outcome — it is verified against the gateway using the API
 *      secret, so a forged callback cannot mark an order paid; and
 *   2. the money — every amount is recomputed from database prices and stored
 *      settings, so a tampered cart cannot change what was charged.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    const payment =
      d.paymentGateway === "none"
        ? await acceptUnpaid()
        : d.paymentGateway === "cashfree"
          ? await verifyCashfree(d)
          : await verifyRazorpay(d);
    if (payment instanceof Response) return payment;
    const paid = "chargedMinor" in payment;

    // Re-price from the database, then confirm the amount actually authorised by
    // the gateway matches it. This catches both cart tampering and a stale quote.
    const quote = await quoteCart({
      items: d.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingMethodId: d.shippingMethodId ?? null,
    });

    const expectedMinor = toMinorUnits(quote.total);
    if (paid && payment.chargedMinor !== expectedMinor) {
      console.warn("orders/amount-mismatch", {
        gateway: d.paymentGateway,
        gatewayOrderId: payment.gatewayOrderId,
        charged: payment.chargedMinor,
        expected: expectedMinor,
      });
      return bad("Order total does not match the authorised payment.", 409);
    }

    // Size/style/sole ids come from the browser's cart, which can hold ids that
    // no longer exist (deleted options, cached product pages, fallback sizes).
    // They are foreign keys, so keep only the ones that resolve — the payment
    // has already been taken and must not fail on a stale reference.
    const idsOf = (key: "sizeId" | "styleId" | "soleId") =>
      [...new Set(d.items.map((i) => i[key]).filter((v): v is string => !!v))];
    const [sizes, styles, soles] = await Promise.all([
      prisma.size.findMany({ where: { id: { in: idsOf("sizeId") } }, select: { id: true } }),
      prisma.style.findMany({ where: { id: { in: idsOf("styleId") } }, select: { id: true } }),
      prisma.sole.findMany({ where: { id: { in: idsOf("soleId") } }, select: { id: true } }),
    ]);
    const known = {
      sizeId: new Set(sizes.map((x) => x.id)),
      styleId: new Set(styles.map((x) => x.id)),
      soleId: new Set(soles.map((x) => x.id)),
    };
    const ref = (key: keyof typeof known, v: string | null | undefined) =>
      v && known[key].has(v) ? v : null;

    // One order line per cart line, so the same shoe in two sizes or designs
    // keeps both. Prices come from the quote, never from the request.
    const quotedByProduct = new Map(quote.items.map((q) => [q.productId, q]));
    const itemsToCreate = await Promise.all(
      d.items.map(async (source) => {
        const q = quotedByProduct.get(source.productId)!;
        return {
          productId: q.productId,
          productTitle: q.productTitle,
          sku: source.sku ?? null,
          quantity: source.quantity,
          price: q.price,
          totalPrice: q.price * source.quantity,
          productVariantId: source.productVariantId ?? null,
          styleId: ref("styleId", source.styleId),
          soleId: ref("soleId", source.soleId),
          sizeId: ref("sizeId", source.sizeId),
          panelCustomization: (source.panelCustomization ?? {}) as Prisma.InputJsonValue,
          designGlbUrl: source.designGlbUrl ?? null,
          designThumbnail: source.designThumbnail
            ? await uploadBase64ToS3(source.designThumbnail)
            : null,
          designConfig: (source.designConfig ?? undefined) as Prisma.InputJsonValue | undefined,
        };
      })
    );

    const customer = await prisma.user.upsert({
      where: { email: d.customerEmail },
      update: {
        firstName: d.customerFirstName || undefined,
        lastName: d.customerLastName || undefined,
        phone: d.customerPhone || undefined,
      },
      create: {
        email: d.customerEmail,
        firstName: d.customerFirstName || null,
        lastName: d.customerLastName || null,
        phone: d.customerPhone || null,
        role: "USER",
      }
    });

    let created;
    try {
      created = await prisma.order.create({
        data: {
          // The gateway order id is unique, which makes a replayed callback a
          // unique-constraint violation rather than a duplicate order.
          orderId: payment.gatewayOrderId,
          orderNumber: d.orderNumber,
          customerId: customer.id,
          customerEmail: d.customerEmail,
          customerFirstName: d.customerFirstName ?? null,
          customerLastName: d.customerLastName ?? null,
          customerPhone: d.customerPhone ?? null,
          isGuest: d.isGuest ?? false,
          shippingAddress: d.shippingAddress as Prisma.InputJsonValue,
          billingAddress: (d.billingAddress ?? d.shippingAddress) as Prisma.InputJsonValue,
          subtotal: quote.subtotal,
          tax: quote.tax,
          shippingAmount: quote.shippingAmount,
          shippingMethodId: quote.shippingMethodId,
          shippingMethodName: quote.shippingMethodName,
          discount: quote.discount,
          total: quote.total,
          currency: quote.currency,
          paymentStatus: paid ? "PAID" : "PENDING",
          items: { create: itemsToCreate },
        },
        include: { items: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return bad("This payment has already been recorded.", 409);
      }
      throw e;
    }

    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: created.currency || "INR",
      maximumFractionDigits: 0,
    });
    // Fire-and-forget: a mail failure must not fail a paid order.
    void EmailService.sendConfirmationEmail(created.customerEmail, {
      orderNumber: created.orderNumber,
      customerName:
        [created.customerFirstName, created.customerLastName].filter(Boolean).join(" ") ||
        "Valued Customer",
      status: created.status,
      total: formatter.format(created.total),
      items: created.items,
    }).catch((err) => console.error("Order confirmation email failed:", err));

    return ok(created, 201);
  } catch (e) {
    if (e instanceof PricingError) return bad(e.message, e.status);
    if (e instanceof CashfreeError) return bad(e.message, e.status);
    return server(e);
  }
}
