import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { StyleCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);

    const where = q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { styleId: { contains: q, mode: "insensitive" } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.style.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.style.count({ where })
    ]);
    return ok({ items, total, limit });
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = StyleCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    const created = await prisma.style.create({ data: parsed.data });
    return ok(created, 201);
  } catch (e) { return server(e); }
}
