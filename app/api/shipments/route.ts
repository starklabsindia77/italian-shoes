// app/api/shipments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ShipStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);
  const status = (searchParams.get("status") as ShipStatus | null) ?? null;
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  try {
    // Use 'any' to avoid TS complaining about unknown columns
    const rows = (await (prisma as any).order.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    })) as any[];

    const getStatus = (o: any): ShipStatus => {
      // prefer explicit shipment status; fall back to fulfillmentStatus
      const s =
        o.shiprocketStatus ??
        o.shippingStatus ??
        o.shipmentStatus ??
        o.fulfillmentStatus ??
        "pending";
      // normalize to our enum
      const normalized = String(s).toLowerCase().replace(/\s+/g, "_");
      if (["pending", "picked_up", "in_transit", "delivered", "failed"].includes(normalized))
        return normalized as ShipStatus;
      // map common fulfillment states
      if (normalized === "shipped") return "in_transit";
      if (normalized === "ready_to_ship") return "pending";
      return "pending";
    };

    const getCustomer = (o: any) => {
      const first = o.customerFirstName ?? o.firstName ?? null;
      const last = o.customerLastName ?? o.lastName ?? null;
      const email = o.customerEmail ?? o.email ?? null;
      const name = [first, last].filter(Boolean).join(" ");
      return name || email || "Guest";
    };

    const items = rows
      .map((o) => {
        const st = getStatus(o);
        return {
          id: o.id,
          orderId: o.id,
          orderNumber: o.orderNumber ?? o.order_id ?? (o.id ? String(o.id).slice(-6) : ""),
          customer: getCustomer(o),
          courierName: o.courierName ?? o.courier ?? null,
          awbNumber: o.awbNumber ?? o.trackingNumber ?? null,
          trackingUrl: o.trackingUrl ?? o.shiprocketTrackingUrl ?? null,
          labelUrl: o.labelUrl ?? null,
          status: st as ShipStatus,
          estimatedDelivery:
            (o.estimatedDelivery ??
              o.estimatedDeliveryAt ??
              o.eta ??
              null) && new Date(o.estimatedDelivery ?? o.estimatedDeliveryAt ?? o.eta).toISOString(),
          actualDelivery:
            (o.actualDelivery ??
              o.deliveredAt ??
              null) && new Date(o.actualDelivery ?? o.deliveredAt).toISOString(),
          createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
        };
      })
      .filter((x) => (status ? x.status === status : true))
      .filter((x) => {
        if (!q) return true;
        return (
          (x.orderNumber ?? "").toLowerCase().includes(q) ||
          (x.customer ?? "").toLowerCase().includes(q) ||
          (x.awbNumber ?? "").toLowerCase().includes(q) ||
          (x.courierName ?? "").toLowerCase().includes(q)
        );
      });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
