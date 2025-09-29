import { prisma } from "@/lib/prisma";
import { ok, notFound, bad, server, requireAdmin } from "@/lib/api-helpers";
import { MaterialColorCreateSchema } from "@/lib/validators";

// ✅ GET all colors for a material
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ await here
    const m = await prisma.material.findUnique({
      where: { id },
      include: { colors: true },
    });
    return m ? ok(m) : notFound();
  } catch (e) {
    return server(e);
  }
}

// ✅ POST create a new color for a material

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure only admin can create
    await requireAdmin();

    // Parse request body
    const body = await req.json();
    const { id } = await params;

    // Normalize input to match schema
    const data = {
      materialId: id,
      name: body.name,
      family: body.family || undefined, // optional
      colorCode: body.colorCode || undefined, // optional
      imageUrl: body.imageUrl || undefined, // optional
      isActive:
        body.isActive === undefined ? undefined : Boolean(body.isActive),
    };

    // Validate using Zod
    const p = MaterialColorCreateSchema.safeParse(data);
    if (!p.success) {
      console.error("Validation failed:", p.error.format());
      return bad("Validation failed: " + JSON.stringify(p.error.format()));
    }

    // Create the color in DB
    const color = await prisma.materialColor.create({
      data: p.data,
    });

    return ok(color, 201);
  } catch (e) {
    return server(e);
  }
}
