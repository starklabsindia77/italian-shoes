import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

const handleError = (error: unknown, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ success: false, error: message }, { status });
};

export async function GET(req: NextRequest) { 

  try {
    console.log("Fetching data at:", new Date().toISOString());

    const colors = await prisma.color.findMany();
    const sizes = await prisma.sizeOption.findMany();
    const soles = await prisma.soleOption.findMany();
    const materials = await prisma.material.findMany();
    const styles = await prisma.styleOption.findMany();
    const panels = await prisma.panel.findMany();

    // Use raw queries to bypass potential Prisma caching
    // const [sizes, styles, soles, materials, colors, panels] = await Promise.all([
    //   prisma.$queryRaw<{ id: number, sizeSystem: string, size: number, width: number }[]>`SELECT "id", "sizeSystem", "size", "width" FROM "SizeOption" ORDER BY "size" ASC`,
    //   prisma.$queryRaw<{ id: number, name: string, imageUrl: string }[]>`SELECT "id", "name", "imageUrl" FROM "StyleOption" ORDER BY "name" ASC`,
    //   prisma.$queryRaw<{ id: number, type: string, height: number }[]>`SELECT "id", "type", "height" FROM "SoleOption" ORDER BY "type" ASC`,
    //   prisma.$queryRaw<{ id: number, name: string, description: string }[]>`SELECT "id", "name", "description" FROM "Material" ORDER BY "name" ASC`,
    //   prisma.$queryRaw<{ id: number, name: string, hexCode: string }[]>`SELECT "id", "name", "hexCode" FROM "Color" ORDER BY "name" ASC`,
    //   prisma.$queryRaw<{ id: number, name: string, description: string }[]>`SELECT "id", "name", "description" FROM "Panel" ORDER BY "name" ASC`,
    // ]);

    // Log raw results
    console.log("Raw Sizes:", sizes);
    console.log("Raw Styles:", styles);
    console.log("Raw Soles:", soles);
    console.log("Raw Materials:", materials);
    console.log("Raw Colors:", colors);
    console.log("Raw Panels:", panels);

    const response = NextResponse.json({
      success: true,
      data: { sizes, styles, soles, materials, colors, panels },
      meta: {
        totalSizes: sizes.length,
        totalStyles: styles.length,
        totalSoles: soles.length,
        totalMaterials: materials.length,
        totalColors: colors.length,
        totalPanels: panels.length,
        timestamp: new Date().toISOString(),
      },
    });

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    return handleError(error, "Error fetching variant form data");
  } finally {
    await prisma.$disconnect();
  }
}