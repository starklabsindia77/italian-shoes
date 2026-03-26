import { prisma } from "@/lib/prisma";
import { ok, server, requirePermission } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("customers.manage");
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: { role: string; customRoleId: null; OR?: Record<string, unknown>[] } = {
      role: "USER",
      customRoleId: null,
    };
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const users = await prisma.user.findMany({
      where: where as any,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const items = (users as Array<typeof users[number] & { _count: { orders: number } }>).map(u => ({
      id: u.id,
      customerId: u.customerId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isGuest: u.passwordHash === null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      _ordersCount: u._count.orders
    }));

    return ok({ items });
  } catch (e) { return server(e); }
}
