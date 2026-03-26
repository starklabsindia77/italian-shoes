import { prisma } from "@/lib/prisma";
import { ok, server, notFound, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const s = await prisma.size.findUnique({ where: { id } });
    return s ? ok(s) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const updated = await prisma.size.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.size.delete({ where: { id } });
    return ok({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    return server(e);
  }
}
