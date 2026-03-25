import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, server, requireAuth, requireAdmin } from "@/lib/api-helpers";
import { OrderUpdateStatusSchema } from "@/lib/validators";
import { EmailService } from "@/lib/email-service";

// Helper to map Prisma Order to frontend OrderFull
function mapOrderResponse(o: any) {
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
    items: o.items?.map((it: any) => ({
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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAuth();
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
    return ok(mapOrderResponse(o));
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
    const updateData: any = {};
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
          status: (d.shiprocket.status || "PENDING").toUpperCase() as any,
          trackingUrl: d.shiprocket.trackingUrl,
          labelUrl: d.shiprocket.labelUrl,
          estimatedDelivery: d.shiprocket.estimatedDelivery ? new Date(d.shiprocket.estimatedDelivery) : null,
          actualDelivery: d.shiprocket.actualDelivery ? new Date(d.shiprocket.actualDelivery) : null,
        },
        update: {
          awbNumber: d.shiprocket.awbNumber,
          courierName: d.shiprocket.courierName,
          status: d.shiprocket.status ? d.shiprocket.status.toUpperCase() as any : undefined,
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
        items: (updated as any).items || []
      });
    }

    return ok(mapOrderResponse(updated));
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    await prisma.order.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}
