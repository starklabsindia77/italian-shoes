import { prisma } from "@/lib/prisma";
import { ok, server, notFound, requireAdmin } from "@/lib/api-helpers";
import { revalidateTag } from "next/cache";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const p = await prisma.panel.findUnique({ where: { id } });
    return p ? ok(p) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const updated = await prisma.panel.update({ where: { id }, data });
    revalidateTag("panels");
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
    await prisma.panel.delete({ where: { id: id } });
    revalidateTag("panels");
    return ok({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    return server(e);
  }
}
