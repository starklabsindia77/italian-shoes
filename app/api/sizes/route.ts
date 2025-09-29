import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { SizeCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const region = sp.get("region") as "US" | "EU" | "UK" | null;
    const { skip, limit } = pagination(req);

    const where: any = {};
    if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { sizeId: { contains: q, mode: "insensitive" } }];
    if (region) where.region = region;

    const [items, total] = await Promise.all([
      prisma.size.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { value: "asc" }]
      }),
      prisma.size.count({ where })
    ]);
    return ok({ items, total, limit });
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = SizeCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    const created = await prisma.size.create({ data: parsed.data });
    return ok(created, 201);
  } catch (e) { return server(e); }
}
