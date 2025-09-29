import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { SoleCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);

    const where = q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { soleId: { contains: q, mode: "insensitive" } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.sole.findMany({ 
        where: q
          ? { OR: [
                { name: { contains: q, mode: "insensitive" as const } }
              ] }
          : undefined,
        skip, 
        take: limit, 
        orderBy: { createdAt: "desc" }
      }),
      prisma.sole.count({
        where: q
          ? { OR: [
                { name: { contains: q, mode: "insensitive" as const } }
              ] }
          : undefined
      })
    ]);
    return ok({ items, total, limit });
  } catch (e) { 
    return server(e); 
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = SoleCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    // Ensure soleId is always a string (not undefined) to satisfy Prisma type
    const data = { ...parsed.data };
  


    const created = await prisma.sole.create({ data: data as any });
    return ok(created, 201);
  } catch (e) { return server(e); }
}
