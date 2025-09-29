import { prisma } from "@/lib/prisma";
import { ok, bad, server, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const s = await prisma.orderShipment.findUnique({ where: { orderId: params.id } });
    return ok(s ?? null);
  } catch (e) { return server(e); }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const s = await prisma.orderShipment.upsert({
      where: { orderId: params.id },
      update: body,
      create: { orderId: params.id, ...body }
    });
    return ok(s, 201);
  } catch (e) { return server(e); }
}
