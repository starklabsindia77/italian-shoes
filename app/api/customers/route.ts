import { prisma } from "@/lib/prisma";
import { ok, bad, server, requireAdmin, requirePermission } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("customers.manage");
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
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

    const users = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    }) as any[];

    const items = users.map(u => ({
      id: u.id,
      customerId: u.customerId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isGuest: u.passwordHash === null, // Assumption: guests don't have passwords
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      _ordersCount: u._count.orders
    }));

    return ok({ items });
  } catch (e) { return server(e); }
}
