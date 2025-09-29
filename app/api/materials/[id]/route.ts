import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, server, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const m = await prisma.material.findUnique({ where: { id: id }, include: { colors: true } });
    return m ? ok(m) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = await req.json();
    const { id } = await params;
    const m = await prisma.material.update({ where: { id: id }, data });
    return ok(m);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return server(e);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    console.log("DELETE color API called with:", params);
    const { id } = await params;
    await prisma.material.delete({ where: { id: id} });
    return ok({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return server(e);
  }
}




