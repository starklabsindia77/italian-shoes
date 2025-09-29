import { prisma } from "@/lib/prisma";
import { ok, server } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const soles = await prisma.sole.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return ok({ soles });
  } catch (e) {
    return server(e);
  }
}
