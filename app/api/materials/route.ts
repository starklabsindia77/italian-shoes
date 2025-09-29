import { prisma } from "@/lib/prisma";
import { ok, bad, server, pagination, requireAdmin } from "@/lib/api-helpers";
import { MaterialCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
    try {
        const { skip, limit } = pagination(req);
        const [items, total] = await Promise.all([
            prisma.material.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
            prisma.material.count()
        ]);
        return ok({ items, total, limit });
    } catch (e) { return server(e); }
}

export async function POST(req: Request) {
    try {
        await requireAdmin();
        const body = await req.json();
        const p = MaterialCreateSchema.safeParse(body);
        if (!p.success) return bad(p.error.message);
        const m = await prisma.material.create({ data: p.data });
        return ok(m, 201);
    } catch (e) { return server(e); }
}
