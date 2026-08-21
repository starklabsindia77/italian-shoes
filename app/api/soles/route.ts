import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { SoleCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);

    const searchFilter = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { soleId: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [items, total] = await Promise.all([
      prisma.sole.findMany({
        where: searchFilter,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sole.count({
        where: searchFilter,
      }),
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

    // Generate the business id when the dashboard form omits it.
    const data = { ...parsed.data, soleId: parsed.data.soleId ?? randomUUID() };
  


    const created = await prisma.sole.create({ data: data });
    return ok(created, 201);
  } catch (e) { return server(e); }
}
