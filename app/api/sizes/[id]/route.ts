import { prisma } from "@/lib/prisma";
import { ok, bad, server, notFound, requireAdmin } from "@/lib/api-helpers";
import { SizeUpdateSchema } from "@/lib/validators";

// These handlers once used raw string-built SQL to bypass drift between
// schema.prisma and the live database. Schema and migrations are
// reconciled now — and the old PUT interpolated request-body keys as SQL
// column identifiers, which was an injection sink. Plain Prisma only.

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
    const body = await req.json();

    const parsed = SizeUpdateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);
    // sizeId is a stable business identifier; ignore attempts to change it
    // here, matching the old handler's behavior.
    const { sizeId: _ignored, ...data } = parsed.data;

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
