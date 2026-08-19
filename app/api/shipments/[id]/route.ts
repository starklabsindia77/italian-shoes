// app/api/shipments/[id]/route.ts
// `[id]` is the Order id. OrderShipment is 1:1 with Order and is created on
// first write, so updates are an upsert keyed on orderId.
import { FulfillmentStatus, ShipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, server, requirePermission } from "@/lib/api-helpers";
import { ShipmentUpdateSchema } from "@/lib/validators";

/** Keep the order's coarse fulfillment state consistent with the shipment. */
const FULFILLMENT_BY_SHIPMENT: Partial<Record<ShipmentStatus, FulfillmentStatus>> = {
  PENDING: "READY_TO_SHIP",
  PICKED_UP: "SHIPPED",
  IN_TRANSIT: "SHIPPED",
  DELIVERED: "DELIVERED",
  // FAILED has no fulfillment equivalent — leave the order's state alone.
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("orders.edit");
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return bad("Invalid JSON body");

    const parsed = ShipmentUpdateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const d = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, shippedAt: true, deliveredAt: true },
    });
    if (!order) return notFound("Order not found");

    const shipmentData: {
      courierName?: string | null;
      awbNumber?: string | null;
      trackingUrl?: string | null;
      labelUrl?: string | null;
      status?: ShipmentStatus;
      estimatedDelivery?: Date | null;
      actualDelivery?: Date | null;
    } = {};

    if ("courierName" in d) shipmentData.courierName = d.courierName ?? null;
    if ("awbNumber" in d) shipmentData.awbNumber = d.awbNumber ?? null;
    if ("trackingUrl" in d) shipmentData.trackingUrl = d.trackingUrl ?? null;
    if ("labelUrl" in d) shipmentData.labelUrl = d.labelUrl ?? null;
    if ("estimatedDelivery" in d) {
      shipmentData.estimatedDelivery = d.estimatedDelivery ? new Date(d.estimatedDelivery) : null;
    }
    if ("actualDelivery" in d) {
      shipmentData.actualDelivery = d.actualDelivery ? new Date(d.actualDelivery) : null;
    }

    const nextStatus = d.status ? (d.status.toUpperCase() as ShipmentStatus) : undefined;
    if (nextStatus) shipmentData.status = nextStatus;

    const updated = await prisma.$transaction(async (tx) => {
      const shipment = await tx.orderShipment.upsert({
        where: { orderId: id },
        update: shipmentData,
        create: { orderId: id, ...shipmentData },
      });

      if (nextStatus) {
        const fulfillmentStatus = FULFILLMENT_BY_SHIPMENT[nextStatus];
        const orderData: {
          fulfillmentStatus?: FulfillmentStatus;
          shippedAt?: Date;
          deliveredAt?: Date;
        } = {};

        if (fulfillmentStatus) orderData.fulfillmentStatus = fulfillmentStatus;
        if (
          (nextStatus === "PICKED_UP" || nextStatus === "IN_TRANSIT") &&
          !order.shippedAt
        ) {
          orderData.shippedAt = new Date();
        }
        if (nextStatus === "DELIVERED" && !order.deliveredAt) {
          orderData.deliveredAt = shipment.actualDelivery ?? new Date();
        }

        if (Object.keys(orderData).length > 0) {
          await tx.order.update({ where: { id }, data: orderData });
        }
      }

      return shipment;
    });

    return ok(updated);
  } catch (e) {
    return server(e);
  }
}
