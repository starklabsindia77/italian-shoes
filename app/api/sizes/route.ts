import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, getSearchParams, requireAdmin } from "@/lib/api-helpers";
import { SizeCreateSchema } from "@/lib/validators";
import { revalidateTag } from "next/cache";

export async function GET(req: Request) {
  try {
    const sp = getSearchParams(req);
    const q = sp.get("q")?.trim() || undefined;
    const regionVal = sp.get("region");
    const region = (regionVal === "US" || regionVal === "EU" || regionVal === "UK") ? regionVal : undefined;
    
    const { skip, limit } = pagination(req);

    // Plain Prisma queries. This handler once bypassed the model with raw
    // SQL to survive drift between schema.prisma and the live database;
    // schema and migrations are reconciled now, and raw string-built SQL
    // was an injection liability.
    const where = {
      isActive: true,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(region ? { region } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.size.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
        skip,
        take: limit,
      }),
      // Matches the previous behavior: the total ignores q/region filters.
      prisma.size.count({ where: { isActive: true } }),
    ]);

    const data = { items, total, limit };

    const response = ok(data);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
    return response;
  } catch (e) {
    console.error("GET /api/sizes error:", e);
    return server(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = SizeCreateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    // The dashboard form doesn't send a business id; generate one.
    const created = await prisma.size.create({
      data: { ...parsed.data, sizeId: parsed.data.sizeId ?? randomUUID() },
    });

    // Invalidate sizes cache
    revalidateTag("sizes");

    return ok(created, 201);
  } catch (e) { return server(e); }
}
