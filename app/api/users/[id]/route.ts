import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, server } from "@/lib/api-helpers";
import { UserUpdateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = UserUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone, password, role, isActive, customRoleId } = parsed.data;

    const updateData: any = {
      firstName: firstName !== undefined ? firstName : undefined,
      lastName: lastName !== undefined ? lastName : undefined,
      phone: phone !== undefined ? phone : undefined,
      role: role !== undefined ? role : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      customRoleId: customRoleId !== undefined ? customRoleId : undefined,
    };

    if (password && password.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        customRoleId: true,
        customRole: { select: { name: true } },
        createdAt: true,
      } as any,
    });

    return NextResponse.json(user);
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
    
    // Prevent self-deletion
    const session = await requireAdmin();
    if ((session.user as any).id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return server(e);
  }
}
