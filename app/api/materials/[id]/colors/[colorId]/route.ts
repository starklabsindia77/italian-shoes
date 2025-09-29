import { prisma } from "@/lib/prisma";
import { ok, notFound, server, requireAdmin } from "@/lib/api-helpers";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; colorId: string }> }
) {
  try {
    await requireAdmin();
    const { colorId } = await params; // ✅ must await

    const color = await prisma.materialColor.findUnique({
      where: { id: colorId },
    });
    
    if (!color) return notFound();

    await prisma.materialColor.delete({
      where: { id: colorId },
    });

    return ok({ message: "Color deleted" });
  } catch (e) {
    return server(e);
  }
}
