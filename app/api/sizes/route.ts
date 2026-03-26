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

    // Bypass Prisma model to avoid missing column error
    let query = `SELECT id, name, region, value, "euEquivalent", "ukEquivalent", "isActive", "sortOrder", "extId", "createdAt", "updatedAt" FROM "Size" WHERE "isActive" = true`;
    if (q) {
      query += ` AND ("name" ILIKE '%${q.replace(/'/g, "''")}%')`;
    }
    if (region) {
      query += ` AND "region" = '${region}'`;
    }
    query += ` ORDER BY "sortOrder" ASC, "value" ASC OFFSET ${skip} LIMIT ${limit}`;

    const [items, totalCountResult] = await Promise.all([
      prisma.$queryRawUnsafe<Record<string, unknown>[]>(query),
      prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) as count FROM "Size" WHERE "isActive" = true`)
    ]);

    const total = Number(totalCountResult[0].count);
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

    const created = await prisma.size.create({ data: parsed.data });

    // Invalidate sizes cache
    revalidateTag("sizes");

    return ok(created, 201);
  } catch (e) { return server(e); }
}
