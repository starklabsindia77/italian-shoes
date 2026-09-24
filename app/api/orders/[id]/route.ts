import { prisma } from "@/lib/prisma";
type ShipmentStatus = "PENDING" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
import { ok, bad, notFound, forbidden, server, requireAuth, requireAdmin } from "@/lib/api-helpers";
import { OrderUpdateStatusSchema } from "@/lib/validators";
import { EmailService } from "@/lib/email-service";

// Helper to map Prisma Order to frontend OrderFull
/* eslint-disable @typescript-eslint/no-explicit-any */
function mapOrderResponse(o: Record<string, any>) {
  return {
    id: o.id,
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    customer: {
      email: o.customerEmail,
      firstName: o.customerFirstName,
      lastName: o.customerLastName,
      phone: o.customerPhone,
      isGuest: o.isGuest,
    },
    shipping: o.shippingAddress,
    billing: o.billingAddress,
    items: (o.items as Record<string, any>[] | undefined)?.map((it) => ({
      ...it,
      title: it.productTitle, // Ensure compatibility with existing 'title' usages if any
      style: it.style ? { styleId: it.style.id, styleName: it.style.name } : null,
      sole: it.sole ? { soleId: it.sole.id, soleName: it.sole.name } : null,
      size: it.size ? { sizeId: it.size.id, sizeName: it.size.name } : null,
    })) || [],
    pricing: {
      subtotal: o.subtotal,
      tax: o.tax,
      shipping: o.shippingAmount,
      discount: o.discount,
      total: o.total,
      currency: o.currency,
    },
    status: o.status.toLowerCase(),
    paymentStatus: o.paymentStatus.toLowerCase(),
    // Null on orders placed before the column existed.
    paymentMethod: o.paymentMethod ?? null,
    fulfillmentStatus: o.fulfillmentStatus.toLowerCase(),
    manufacturing: {
      estimatedProductionTime: o.estimatedProductionTime,
      actualProductionTime: o.actualProductionTime,
      productionStartDate: o.productionStartDate,
      productionEndDate: o.productionEndDate,
      qualityCheckDate: o.qualityCheckDate,
      notes: o.manufacturingNotes,
    },
    shiprocket: o.shipment ? {
      ...o.shipment,
      status: o.shipment.status.toLowerCase(),
    } : { status: "pending" },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/**
 * Panel customizations only snapshot colorUrl/colorName/materialName at order
 * time. Look the swatch up in the material catalog (by its image URL) so staff
 * can see the colour family, codes and material details. Best effort: a colour
 * deleted since the order simply gets no `details`.
 */
// The catalog stores asset paths ("/colors/x.jpg") while orders snapshot the
// resolved URL ("https://<bucket>/colors/x.jpg"), so compare on the path.
function assetKey(url: string) {
  try {
    return url.startsWith("http") ? decodeURI(new URL(url).pathname) : url;
  } catch {
    return url;
  }
}

async function withSwatchDetails(o: Record<string, any>) {
  const urls = new Set<string>();
  for (const it of o.items ?? []) {
    for (const v of Object.values(it.panelCustomization ?? {}) as any[]) {
      if (typeof v?.colorUrl === "string" && v.colorUrl) {
        urls.add(v.colorUrl);
        urls.add(assetKey(v.colorUrl));
      }
    }
  }
  if (urls.size === 0) return o;

  const colors = await prisma.materialColor.findMany({
    where: { imageUrl: { in: [...urls] } },
    include: { material: { select: { name: true, category: true, description: true } } },
  });
  const byUrl = new Map(colors.map((c) => [assetKey(c.imageUrl ?? ""), c]));

  return {
    ...o,
    items: o.items.map((it: Record<string, any>) => {
      if (!it.panelCustomization || typeof it.panelCustomization !== "object") return it;
      const panels = Object.fromEntries(
        Object.entries(it.panelCustomization as Record<string, any>).map(([panel, v]) => {
          const c = v?.colorUrl ? byUrl.get(assetKey(v.colorUrl)) : undefined;
          if (!c) return [panel, v];
          return [panel, {
            ...v,
            details: {
              colorName: c.name,
              colorCode: c.colorCode,
              family: c.family,
              hexCode: c.hexCode,
              isActive: c.isActive,
              materialName: c.material.name,
              materialCategory: c.material.category,
              materialDescription: c.material.description,
            },
          }];
        })
      );
      return { ...it, panelCustomization: panels };
    }),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const u = session.user as { id?: string; email?: string | null; role?: string; permissions?: string[] };

    const o = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { style: true, sole: true, size: true }
        },
        shipment: true
      }
    });
    if (!o) return notFound();

    // Staff may read any order; a customer may only read their own. Without
    // this check any signed-in user could enumerate other customers' orders,
    // including their shipping address and phone number.
    const isStaff = u.role === "ADMIN" || !!u.permissions?.includes("orders.view");
    const isOwner =
      (!!u.id && o.customerId === u.id) ||
      (!!u.email && o.customerEmail.toLowerCase() === u.email.toLowerCase());
    if (!isStaff && !isOwner) return forbidden();

    return ok(mapOrderResponse(await withSwatchDetails(o)));
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const body = await req.json();
    const parsed = OrderUpdateStatusSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    
    const d = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.status) updateData.status = d.status.toUpperCase();
    if (d.paymentStatus) updateData.paymentStatus = d.paymentStatus.toUpperCase();
    if (d.fulfillmentStatus) updateData.fulfillmentStatus = d.fulfillmentStatus.toUpperCase();
    
    if (d.manufacturing) {
      if (d.manufacturing.estimatedProductionTime !== undefined) updateData.estimatedProductionTime = d.manufacturing.estimatedProductionTime;
      if (d.manufacturing.actualProductionTime !== undefined) updateData.actualProductionTime = d.manufacturing.actualProductionTime;
      if (d.manufacturing.productionStartDate !== undefined) updateData.productionStartDate = d.manufacturing.productionStartDate ? new Date(d.manufacturing.productionStartDate) : null;
      if (d.manufacturing.productionEndDate !== undefined) updateData.productionEndDate = d.manufacturing.productionEndDate ? new Date(d.manufacturing.productionEndDate) : null;
      if (d.manufacturing.qualityCheckDate !== undefined) updateData.qualityCheckDate = d.manufacturing.qualityCheckDate ? new Date(d.manufacturing.qualityCheckDate) : null;
      if (d.manufacturing.notes !== undefined) updateData.manufacturingNotes = d.manufacturing.notes;
    }

    if (d.shiprocket) {
      await prisma.orderShipment.upsert({
        where: { orderId: id },
        create: {
          orderId: id,
          awbNumber: d.shiprocket.awbNumber,
          courierName: d.shiprocket.courierName,
          status: (d.shiprocket.status || "PENDING").toUpperCase() as ShipmentStatus,
          trackingUrl: d.shiprocket.trackingUrl,
          labelUrl: d.shiprocket.labelUrl,
          estimatedDelivery: d.shiprocket.estimatedDelivery ? new Date(d.shiprocket.estimatedDelivery) : null,
          actualDelivery: d.shiprocket.actualDelivery ? new Date(d.shiprocket.actualDelivery) : null,
        },
        update: {
          awbNumber: d.shiprocket.awbNumber,
          courierName: d.shiprocket.courierName,
          status: d.shiprocket.status ? d.shiprocket.status.toUpperCase() as ShipmentStatus : undefined,
          trackingUrl: d.shiprocket.trackingUrl,
          labelUrl: d.shiprocket.labelUrl,
          estimatedDelivery: d.shiprocket.estimatedDelivery ? new Date(d.shiprocket.estimatedDelivery) : null,
          actualDelivery: d.shiprocket.actualDelivery ? new Date(d.shiprocket.actualDelivery) : null,
        },
      });
    }

    const updated = await prisma.order.update({ 
      where: { id }, 
      data: updateData,
      include: { items: true, shipment: true }
    });

    // 2. Send Status Update Email if status changed
    if (d.status && d.status.toUpperCase() !== updated.status) {
      const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: updated.currency || "INR", maximumFractionDigits: 0 });
      EmailService.sendOrderUpdateEmail(updated.customerEmail, {
        orderNumber: updated.orderNumber,
        customerName: [updated.customerFirstName, updated.customerLastName].filter(Boolean).join(" ") || "Valued Customer",
        status: updated.status,
        total: formatter.format(updated.total),
        items: (updated as unknown as { items: unknown[] }).items || []
      });
    }

    return ok(mapOrderResponse(updated));
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    if ((e as { code?: number; message?: string })?.code === 401 || (e as { code?: number; message?: string })?.code === 403) return bad((e as Error).message, (e as { code: number }).code);
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await prisma.order.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    if ((e as { code?: number; message?: string })?.code === 401 || (e as { code?: number; message?: string })?.code === 403) return bad((e as Error).message, (e as { code: number }).code);
    return server(e);
  }
}
