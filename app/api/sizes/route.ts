import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { SizeCreateSchema } from "@/lib/validators";
import { unstable_cache, revalidateTag } from "next/cache";

// Cached function for fetching sizes
const getCachedSizes = (q?: string, region?: string, skip?: number, limit?: number) =>
  unstable_cache(
    async () => {
      const where: any = {};
      if (q) where.OR = [{ name: { contains: q, mode: "insensitive" as any } }, { sizeId: { contains: q, mode: "insensitive" as any } }];
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
      return { items, total, limit };
    },
    [`sizes-${q}-${region}-${skip}-${limit}`],
    { revalidate: 3600, tags: ["sizes"] }
  )();

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const region = sp.get("region") as "US" | "EU" | "UK" | null;
    const { skip, limit } = pagination(req);

    const data = await getCachedSizes(q ?? undefined, region ?? undefined, skip, limit);

    const response = ok(data);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
    return response;
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = SizeCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    const created = await prisma.size.create({ data: parsed.data });

    // Invalidate sizes cache
    revalidateTag("sizes");

    return ok(created, 201);
  } catch (e) { return server(e); }
}
