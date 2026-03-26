import { prisma } from "@/lib/prisma";
import { ok, server, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const s = await prisma.orderShipment.findUnique({ where: { orderId: id } });
    return ok(s ?? null);
  } catch (e) { return server(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const s = await prisma.orderShipment.upsert({
      where: { orderId: id },
      update: body,
      create: { orderId: id, ...body }
    });
    return ok(s, 201);
  } catch (e) { return server(e); }
}
