import { prisma } from "@/lib/prisma";
import { ok, bad, server, requireAdmin } from "@/lib/api-helpers";
import { SizeCreateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!Array.isArray(body) || body.length === 0) return bad("Expected non-empty array");

    const records = [];
    for (const item of body) {
      const parsed = SizeCreateSchema.safeParse(item);
      if (!parsed.success) return bad(parsed.error.message);
      records.push(parsed.data);
    }

    const result = await prisma.$transaction(
      records.map((r) =>
        prisma.size.upsert({
          where: { sizeId: r.sizeId },
          update: r,
          create: r
        })
      )
    );
    return ok({ count: result.length }, 201);
  } catch (e) { return server(e); }
}
