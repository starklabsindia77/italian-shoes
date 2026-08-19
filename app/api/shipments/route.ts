// app/api/shipments/route.ts
import { Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, server, requirePermission, getSearchParams } from "@/lib/api-helpers";

type ShipStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

const SHIP_STATUSES: ShipStatus[] = ["pending", "picked_up", "in_transit", "delivered", "failed"];

/** Orders carry a coarse fulfillment state; use it when no OrderShipment row exists yet. */
function statusFromFulfillment(fulfillment: string): ShipStatus {
  switch (fulfillment) {
    case "SHIPPED":
      return "in_transit";
    case "DELIVERED":
      return "delivered";
    default:
      return "pending";
  }
}

export async function GET(req: Request) {
  try {
    await requirePermission("orders.view");

    const sp = getSearchParams(req);
    const limit = Math.min(Number(sp.get("limit") ?? 100) || 100, 200);
    const statusParam = sp.get("status");
    const status = SHIP_STATUSES.includes(statusParam as ShipStatus)
      ? (statusParam as ShipStatus)
      : null;
    const q = (sp.get("q") ?? "").trim();

    const where: Prisma.OrderWhereInput = {};

    if (status) {
      const enumStatus = status.toUpperCase() as ShipmentStatus;
      if (status === "pending") {
        // A missing shipment row is implicitly pending.
        where.OR = [
          { shipment: { status: enumStatus } },
          { shipment: { is: null }, fulfillmentStatus: { notIn: ["SHIPPED", "DELIVERED"] } },
        ];
      } else {
        where.shipment = { status: enumStatus };
      }
    }

    if (q) {
      const contains = { contains: q, mode: "insensitive" as const };
      where.AND = [
        {
          OR: [
            { orderNumber: contains },
            { customerEmail: contains },
            { customerFirstName: contains },
            { customerLastName: contains },
            { shipment: { awbNumber: contains } },
            { shipment: { courierName: contains } },
          ],
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { shipment: true },
    });

    const items = orders.map((o) => {
      const s = o.shipment;
      const customerName = [o.customerFirstName, o.customerLastName].filter(Boolean).join(" ");
      return {
        // `id` is the order id: /api/shipments/[id] keys off the order, since
        // OrderShipment is 1:1 with Order and may not exist yet.
        id: o.id,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customer: customerName || o.customerEmail || "Guest",
        courierName: s?.courierName ?? null,
        awbNumber: s?.awbNumber ?? null,
        trackingUrl: s?.trackingUrl ?? null,
        labelUrl: s?.labelUrl ?? null,
        status: (s
          ? (s.status.toLowerCase() as ShipStatus)
          : statusFromFulfillment(o.fulfillmentStatus)) as ShipStatus,
        estimatedDelivery: s?.estimatedDelivery?.toISOString() ?? null,
        actualDelivery: s?.actualDelivery?.toISOString() ?? o.deliveredAt?.toISOString() ?? null,
        createdAt: o.createdAt.toISOString(),
      };
    });

    return ok({ items });
  } catch (e) {
    return server(e);
  }
}
