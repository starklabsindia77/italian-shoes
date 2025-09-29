import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAuth } from "@/lib/api-helpers";
import { OrderCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    await requireAuth(); // users can list their own via q?email= or admins can see all (add admin guard if you want)
    const sp = getSearchParams(req);
    const email = sp.get("email") ?? undefined;
    const { skip, limit } = pagination(req);
    const where = email ? { customerEmail: email } : {};
    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.order.count({ where })
    ]);
    return ok({ items, total, limit });
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    const created = await prisma.order.create({
      data: {
        orderId: d.orderId, orderNumber: d.orderNumber,
        customerEmail: d.customerEmail, customerFirstName: d.customerFirstName ?? null,
        customerLastName: d.customerLastName ?? null, customerPhone: d.customerPhone ?? null,
        isGuest: d.isGuest ?? false,
        shippingAddress: d.shippingAddress, billingAddress: d.billingAddress,
        subtotal: d.subtotal, tax: d.tax, shippingAmount: d.shippingAmount, discount: d.discount, total: d.total,
        currency: d.currency,
        items: {
          create: d.items.map(it => ({
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
            designThumbnail: it.designThumbnail ?? null,
            designConfig: it.designConfig ?? null
          }))
        }
      }
    });

    return ok(created, 201);
  } catch (e) { return server(e); }
}
