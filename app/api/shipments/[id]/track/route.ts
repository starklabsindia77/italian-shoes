// app/api/shipments/[id]/track/route.ts
// The shipments dashboard calls this to refresh live tracking from the courier.
// There is no courier API client in this codebase yet, so this endpoint reports
// that explicitly instead of 404-ing or inventing tracking data.
import { ok, bad, notFound, server, requirePermission } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("orders.edit");
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, shipment: true },
    });
    if (!order) return notFound("Order not found");

    const settings = await getSettings();
    if (settings.integrations.shiprocketStatus !== "connected") {
      return bad(
        "Shiprocket is not connected. Connect it under Settings → Payments/Integrations before syncing tracking.",
        409
      );
    }

    // Connecting Shiprocket only stores an email and store id today — no API
    // token — so there are no credentials to authenticate a tracking call with.
    return bad(
      "Live tracking sync is not implemented: no Shiprocket API credentials are stored. Update the AWB and status manually, or add a Shiprocket API client.",
      501
    );
  } catch (e) {
    return server(e);
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("orders.view");
    const { id } = await params;
    const shipment = await prisma.orderShipment.findUnique({ where: { orderId: id } });
    return ok(shipment ?? null);
  } catch (e) {
    return server(e);
  }
}
