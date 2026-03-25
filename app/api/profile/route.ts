import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, server } from "@/lib/api-helpers";
import { AdminProfileUpdateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAdmin();
    // In App Router, requireAdmin already returns the session if valid.
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = (await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      } as any,
    })) as any;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    return server(e);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unparsed = await req.json();
    const parsed = AdminProfileUpdateSchema.safeParse(unparsed);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone, currentPassword, newPassword } = parsed.data;

    // Fetch the user including the passwordHash
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
    };

    // Handle password update
    if (newPassword && newPassword.length > 0) {
      if (!currentPassword) {
         return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
      }
      
      if (!user.passwordHash) {
         return NextResponse.json({ error: "Cannot verify current password (No password recorded)" }, { status: 400 });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = (await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      } as any,
    })) as any;

    return NextResponse.json(updatedUser);
  } catch (e) {
    return server(e);
  }
}
