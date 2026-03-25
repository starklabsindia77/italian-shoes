import { prisma } from "@/lib/prisma"; // Refreshing TS context
import { ok, bad, server, pagination, getSearchParams, requireAuth, requirePermission } from "@/lib/api-helpers";
import { OrderCreateSchema } from "@/lib/validators";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "@/lib/email-service";

async function uploadBase64ToS3(base64Data: string, folder: string = "designs") {
  if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

  try {
    const [meta, data] = base64Data.split(",");
    const extension = meta.split(";")[0].split("/")[1] || "png";
    const buffer = Buffer.from(data, "base64");
    const fileName = `${uuidv4()}.${extension}`;
    const s3Key = `${folder}/${fileName}`;

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
    const u = session.user as any;
    const sp = getSearchParams(req);
    const email = sp.get("email") ?? undefined;

    // Permissions check
    const hasOrderView = u.role === "ADMIN" || u.permissions?.includes("orders.view");
    if (!hasOrderView) {
        // Only allow viewing own orders if no permission
        if (!email || email !== u.email) {
            return bad("Forbidden", 403);
        }
    }
    const status = sp.get("status") ?? undefined;
    const { skip, limit } = pagination(req);
    const where: any = email ? { customerEmail: email } : {};
    if (status && status !== "all") {
      where.status = status.toUpperCase();
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    // 1. Upload thumbnails to S3 if they are base64
    const itemsWithImages = await Promise.all(d.items.map(async it => ({
      productId: it.productId ?? null,
      productTitle: it.productTitle,
      sku: it.sku ?? null,
      quantity: it.quantity,
      price: it.price,
      totalPrice: it.totalPrice,
      productVariantId: it.productVariantId ?? null,
      styleId: it.styleId ?? null,
      soleId: it.soleId ?? null,
      sizeId: it.sizeId ?? null,
      panelCustomization: it.panelCustomization,
      designGlbUrl: it.designGlbUrl ?? null,
      designThumbnail: it.designThumbnail ? await uploadBase64ToS3(it.designThumbnail) : null,
      designConfig: it.designConfig ?? null
    })));

    // 2. Sync / Create Customer Profile (User table)
    const customer = await prisma.user.upsert({
      where: { email: d.customerEmail },
      update: {
        firstName: d.customerFirstName || undefined,
        lastName: d.customerLastName || undefined,
        phone: d.customerPhone || undefined,
      } as any,
      create: {
        email: d.customerEmail,
        firstName: d.customerFirstName || null,
        lastName: d.customerLastName || null,
        phone: d.customerPhone || null,
        role: "USER",
      } as any
    });

    // 3. Create order in DB
    const created = await prisma.order.create({
      data: {
        orderId: d.orderId, 
        orderNumber: d.orderNumber,
        customerId: customer.id, // Link to User record
        customerEmail: d.customerEmail, 
        customerFirstName: d.customerFirstName ?? null,
        customerLastName: d.customerLastName ?? null, 
        customerPhone: d.customerPhone ?? null,
        isGuest: d.isGuest ?? false,
        shippingAddress: d.shippingAddress, billingAddress: d.billingAddress,
        subtotal: d.subtotal, tax: d.tax, shippingAmount: d.shippingAmount, 
        shippingMethodId: d.shippingMethodId ?? null,
        shippingMethodName: d.shippingMethodName ?? null,
        discount: d.discount, total: d.total,
        currency: d.currency,
        items: {
          create: itemsWithImages
        }
      } as any
    });

    // 3. Send Confirmation Email (Async, don't block response)
    const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: created.currency || "INR", maximumFractionDigits: 0 });
    EmailService.sendConfirmationEmail(created.customerEmail, {
      orderNumber: created.orderNumber,
      customerName: [created.customerFirstName, created.customerLastName].filter(Boolean).join(" ") || "Valued Customer",
      status: created.status,
      total: formatter.format(created.total),
      items: (created as any).items || []
    });

    return ok(created, 201);
  } catch (e) { return server(e); }
}
