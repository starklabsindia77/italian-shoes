import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { PanelCreateSchema } from "@/lib/validators";
import { unstable_cache, revalidateTag } from "next/cache";

// Cached function for fetching panels
const getCachedPanels = (q?: string, skip?: number, limit?: number) =>
  unstable_cache(
    async () => {
      const where = q
        ? { OR: [{ name: { contains: q, mode: "insensitive" as any } }, { panelId: { contains: q, mode: "insensitive" as any } }] }
        : {};

      const [items, total] = await Promise.all([
        prisma.panel.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
        }),
        prisma.panel.count({ where })
      ]);
      return { items, total, limit };
    },
    [`panels-${q}-${skip}-${limit}`],
    { revalidate: 3600, tags: ["panels"] }
  )();

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);

    const data = await getCachedPanels(q ?? undefined, skip, limit);

    const response = ok(data);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
    return response;
  } catch (e) { return server(e); }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = PanelCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    // Ensure panelId is present in the data, as required by the Prisma schema
    const { panelId, ...rest } = parsed.data as any;
    if (!panelId) return bad("panelId is required.");

    const created = await prisma.panel.create({ data: { panelId, ...rest } });

    // Invalidate panels cache
    revalidateTag("panels");

    return ok(created, 201);
  } catch (e) { return server(e); }
}
