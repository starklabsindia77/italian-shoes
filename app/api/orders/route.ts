import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAuth } from "@/lib/api-helpers";
import { OrderCreateSchema } from "@/lib/validators";
import { getS3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "@/lib/email-service";
import { getRazorpayCredentials, verifyPaymentSignature } from "@/lib/razorpay";
import { quoteCart, toMinorUnits, PricingError } from "@/lib/pricing";

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
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
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

/**
 * Records an order after a Razorpay payment.
 *
 * Two things are deliberately NOT taken from the request body:
 *   1. the payment outcome — the Razorpay signature is verified with the API
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

    const credentials = await getRazorpayCredentials();
    if (!credentials) {
      return bad("Razorpay is not configured; cannot verify payment.", 503);
    }

    const signatureValid = verifyPaymentSignature({
      razorpayOrderId: d.razorpayOrderId,
      razorpayPaymentId: d.razorpayPaymentId,
      signature: d.razorpaySignature,
      keySecret: credentials.keySecret,
    });
    if (!signatureValid) {
      console.warn("orders/rejected-signature", { razorpayOrderId: d.razorpayOrderId });
      return bad("Payment could not be verified.", 400);
    }

    // Re-price from the database, then confirm the amount actually authorised by
    // Razorpay matches it. This catches both cart tampering and a stale quote.
    const quote = await quoteCart({
      items: d.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingMethodId: d.shippingMethodId ?? null,
    });

    const RazorpayCtor = (await import("razorpay")).default;
    const razorpay = new RazorpayCtor({
      key_id: credentials.keyId,
      key_secret: credentials.keySecret,
    });

    const remoteOrder = await razorpay.orders.fetch(d.razorpayOrderId);
    const expectedMinor = toMinorUnits(quote.total);
    if (Number(remoteOrder.amount) !== expectedMinor) {
      console.warn("orders/amount-mismatch", {
        razorpayOrderId: d.razorpayOrderId,
        charged: remoteOrder.amount,
        expected: expectedMinor,
      });
      return bad("Order total does not match the authorised payment.", 409);
    }

    const designsByProduct = new Map(d.items.map((i) => [i.productId, i]));
    const itemsToCreate = await Promise.all(
      quote.items.map(async (q) => {
        const source = designsByProduct.get(q.productId);
        return {
          productId: q.productId,
          productTitle: q.productTitle,
          sku: source?.sku ?? null,
          quantity: q.quantity,
          price: q.price,
          totalPrice: q.totalPrice,
          productVariantId: source?.productVariantId ?? null,
          styleId: source?.styleId ?? null,
          soleId: source?.soleId ?? null,
          sizeId: source?.sizeId ?? null,
          panelCustomization: (source?.panelCustomization ?? {}) as Prisma.InputJsonValue,
          designGlbUrl: source?.designGlbUrl ?? null,
          designThumbnail: source?.designThumbnail
            ? await uploadBase64ToS3(source.designThumbnail)
            : null,
          designConfig: (source?.designConfig ?? undefined) as Prisma.InputJsonValue | undefined,
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
          // The Razorpay order id is unique, which makes a replayed callback a
          // unique-constraint violation rather than a duplicate order.
          orderId: d.razorpayOrderId,
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
          paymentStatus: "PAID",
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
    return server(e);
  }
}
