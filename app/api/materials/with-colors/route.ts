import { prisma } from "@/lib/prisma";
import { ok, server } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        colors: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return ok({ materials });
  } catch (e) {
    return server(e);
  }
}
