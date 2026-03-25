import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, server } from "@/lib/api-helpers";
import { UserCreateSchema } from "@/lib/validators";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireAdmin();
    const users = await (prisma.user as any).findMany({
      where: {
        OR: [
          { role: "ADMIN" as any },
          { customRoleId: { not: null } as any }
        ]
      },
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
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (e) {
    return server(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = UserCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone, password, role, customRoleId } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
        passwordHash,
        role,
        customRoleId,
      } as any,
    });

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (e) {
    return server(e);
  }
}
