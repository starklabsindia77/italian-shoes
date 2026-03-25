import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, server } from "@/lib/api-helpers";
import { z } from "zod";

const RoleCreateSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()),
});

export async function GET() {
  try {
    await requireAdmin();
    // Return both standard enum roles (formatted as fake custom roles) and real ones?
    // Actually, for the UI, it's better to just manage custom roles here.
    const customRoles = await (prisma as any).customRole.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customRoles);
  } catch (e) {
    return server(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = RoleCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const { name, permissions } = parsed.data;

    // name check
    const existing = await (prisma as any).customRole.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
    }

    const role = await (prisma as any).customRole.create({
      data: {
        name,
        permissions,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (e) {
    return server(e);
  }
}
