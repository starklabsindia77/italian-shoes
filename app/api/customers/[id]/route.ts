import { prisma } from "@/lib/prisma";
import { ok, bad, notFound, server, requireAdmin } from "@/lib/api-helpers";
import { CustomerUpdateSchema } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    }) as any;
    if (!user) return notFound();

    return ok({
      id: user.id,
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isGuest: user.passwordHash === null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _ordersCount: user._count.orders
    });
  } catch (e) { return server(e); }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const body = await req.json();
    const parsed = CustomerUpdateSchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
      } as any
    });

    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return server(e);
  }
}
