import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { PanelCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim();
    const { skip, limit } = pagination(req);

    const where = q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { panelId: { contains: q, mode: "insensitive" } }] }
      : {};

    // Fix: Ensure 'mode' is of correct type (QueryMode) for Prisma
    

    const [items, total] = await Promise.all([
      prisma.panel.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { panelId: { contains: q, mode: "insensitive" } }
              ]
            }
          : {},
        skip,
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
      }),
      prisma.panel.count({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { panelId: { contains: q, mode: "insensitive" } }
              ]
            }
          : {}
      })
    ]);
    return ok({ items, total, limit });
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
    return ok(created, 201);
  } catch (e) { return server(e); }
}
