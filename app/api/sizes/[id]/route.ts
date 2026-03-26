import { prisma } from "@/lib/prisma";
import { ok, server, notFound, requireAdmin } from "@/lib/api-helpers";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const results = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, name, region, value, "euEquivalent", "ukEquivalent", "isActive", "sortOrder", "extId", "createdAt", "updatedAt" FROM "Size" WHERE id = $1 LIMIT 1`,
      id
    );
    const s = results[0];
    return s ? ok(s) : notFound();
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    
    // Simple update using raw SQL to bypass sizeId
    const setClauses = [];
    const values = [];
    let i = 1;
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (key === 'id' || key === 'sizeId') continue;
      setClauses.push(`"${key}" = $${i}`);
      values.push(value);
      i++;
    }
    values.push(id);
    
    if (setClauses.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Size" SET ${setClauses.join(', ')}, "updatedAt" = NOW() WHERE id = $${i}`,
        ...values
      );
    }

    const results = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, name, region, value, "euEquivalent", "ukEquivalent", "isActive", "sortOrder", "extId", "createdAt", "updatedAt" FROM "Size" WHERE id = $1 LIMIT 1`,
      id
    );
    return ok(results[0]);
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
