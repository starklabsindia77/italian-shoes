import { prisma } from "@/lib/prisma";
import { ok, bad, server, notFound, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const s = await prisma.size.findUnique({ where: { id: params.id } });
    return s ? ok(s) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = await req.json();
    const updated = await prisma.size.update({ where: { id: params.id }, data });
    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.size.delete({ where: { id: params.id } });
    return ok({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return server(e);
  }
}
