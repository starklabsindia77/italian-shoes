// app/api/shipments/[id]/label/route.ts
// The shipments dashboard calls this to generate a courier shipping label.
// No courier API client exists yet, so this reports that explicitly rather than
// 404-ing. An operator-supplied labelUrl can still be saved via PUT /api/shipments/[id].
import { bad, notFound, server, requirePermission } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("orders.edit");
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) return notFound("Order not found");

    const settings = await getSettings();
    if (settings.integrations.shiprocketStatus !== "connected") {
      return bad(
        "Shiprocket is not connected. Connect it under Settings → Payments/Integrations before requesting labels.",
        409
      );
    }

    return bad(
      "Label generation is not implemented: no Shiprocket API credentials are stored. Paste a label URL via the shipment edit form, or add a Shiprocket API client.",
      501
    );
  } catch (e) {
    return server(e);
  }
}
