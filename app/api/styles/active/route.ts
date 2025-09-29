import { prisma } from "@/lib/prisma";
import { ok, server } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const styles = await prisma.style.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return ok({ styles });
  } catch (e) {
    return server(e);
  }
}
