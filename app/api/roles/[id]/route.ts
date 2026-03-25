import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, server } from "@/lib/api-helpers";
import { z } from "zod";

const RoleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = RoleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { name, permissions } = parsed.data;

    const role = await (prisma as any).customRole.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        permissions: permissions !== undefined ? permissions : undefined,
      },
    });

    return NextResponse.json(role);
  } catch (e) {
    return server(e);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if users are using this role
    const usersCount = await (prisma.user as any).count({
      where: { customRoleId: id },
    });

    if (usersCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. It is assigned to ${usersCount} users.` 
      }, { status: 400 });
    }

    await (prisma as any).customRole.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return server(e);
  }
}
