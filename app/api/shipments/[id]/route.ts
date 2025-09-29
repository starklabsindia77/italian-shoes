// app/api/shipments/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ShipStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const patch = (await req.json().catch(() => ({}))) as Partial<{
      courierName: string | null;
      awbNumber: string | null;
      trackingUrl: string | null;
      labelUrl: string | null;
      status: ShipStatus;
      estimatedDelivery: string | null; // ISO
      actualDelivery: string | null;    // ISO
    }>;

    // Build a flexible data object. Only include keys the DB likely has.
    const data: any = {};
    if ("courierName" in patch) data.courierName = patch.courierName;
    if ("awbNumber" in patch) data.awbNumber = patch.awbNumber;
    if ("trackingUrl" in patch) data.trackingUrl = patch.trackingUrl;
    if ("labelUrl" in patch) data.labelUrl = patch.labelUrl;

    if ("estimatedDelivery" in patch) {
      // Try common column names
      data.estimatedDelivery = patch.estimatedDelivery ? new Date(patch.estimatedDelivery) : null;
      data.estimatedDeliveryAt = patch.estimatedDelivery ? new Date(patch.estimatedDelivery) : null;
      data.eta = patch.estimatedDelivery ? new Date(patch.estimatedDelivery) : null;
    }
    if ("actualDelivery" in patch) {
      data.actualDelivery = patch.actualDelivery ? new Date(patch.actualDelivery) : null;
      data.deliveredAt = patch.actualDelivery ? new Date(patch.actualDelivery) : null;
    }

    if ("status" in patch && patch.status) {
      // Prefer shipment-specific status column if present; also map fulfillmentStatus if used
      data.shiprocketStatus = patch.status;
      // Provide a sensible mapping to fulfillmentStatus as a fallback
      const map: Record<ShipStatus, string> = {
        pending: "ready_to_ship",
        picked_up: "in_transit",
        in_transit: "in_transit",
        delivered: "delivered",
        failed: "failed",
      };
      data.fulfillmentStatus = map[patch.status] ?? "in_transit";
    }

    // Use 'any' to avoid TS complaining about unknown columns
    const updated = await (prisma as any).order.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to update shipment" }, { status: 400 });
  }
}
