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
    });

    if (!user) return notFound();

    const castedUser = user as { 
      id: string; 
      customerId?: string | null; 
      email: string | null; 
      firstName: string | null; 
      lastName: string | null; 
      phone: string | null; 
      passwordHash: string | null;
      createdAt: Date;
      updatedAt: Date;
      _count: { orders: number } 
    };

    return ok({
      id: castedUser.id,
      customerId: castedUser.customerId,
      email: castedUser.email,
      firstName: castedUser.firstName,
      lastName: castedUser.lastName,
      phone: castedUser.phone,
      isGuest: castedUser.passwordHash === null,
      createdAt: castedUser.createdAt,
      updatedAt: castedUser.updatedAt,
      _ordersCount: castedUser._count.orders
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
      }
    });

    return ok(updated);
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return notFound();
    return server(e);
  }
}
