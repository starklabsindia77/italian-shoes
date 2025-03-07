import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const handleError = (error: any, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ success: false, error: message }, { status });
};

export async function GET(req: NextRequest) {
  const prisma = new PrismaClient({ log: ["error"] }); // Fresh instance

  try {
    const [sizes, styles, soles, materials, colors, panels] = await Promise.all([
      prisma.sizeOption.findMany({
        select: { id: true, sizeSystem: true, size: true, width: true },
        orderBy: { size: "asc" },
      }),
      prisma.styleOption.findMany({
        select: { id: true, name: true, imageUrl: true },
        orderBy: { name: "asc" },
      }),
      prisma.soleOption.findMany({
        select: { id: true, type: true, height: true },
        orderBy: { type: "asc" },
      }),
      prisma.material.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" },
      }),
      prisma.color.findMany({
        select: { id: true, name: true, hexCode: true },
        orderBy: { name: "asc" },
      }),
      prisma.panel.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" },
      }),
    ]);

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