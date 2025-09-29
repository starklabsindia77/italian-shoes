import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, server, requireAuth, requireAdmin } from "@/lib/api-helpers";
import { OrderUpdateStatusSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const o = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, shipment: true }
    });
    return o ? ok(o) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = OrderUpdateStatusSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    const updated = await prisma.order.update({ where: { id: params.id }, data: parsed.data });
    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.order.delete({ where: { id: params.id } });
    return ok({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    if (e?.code === 401 || e?.code === 403) return bad(e.message, e.code);
    return server(e);
  }
}
