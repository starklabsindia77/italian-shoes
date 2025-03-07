import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize PrismaClient outside the handler for connection reuse


// Common error handling function
const handleError = (error: any, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ success: false, error: message }, { status });
};

// GET: Fetch data for variant form dropdowns
export async function GET(req: NextRequest) {
  const prisma = new PrismaClient({
    log: ["error"], // Minimize logging in production
  });
  try {
    
    // Fetch all data in parallel with consistent sorting
    const [sizes, styles, soles, materials, colors, panels] = await Promise.all([
      prisma.sizeOption.findMany({
        select: { id: true, sizeSystem: true, size: true, width: true },
        orderBy: { size: "asc" }, // Sort for UX consistency
      }),
      prisma.styleOption.findMany({
        select: { id: true, name: true, imageUrl: true },
        orderBy: { name: "asc" }, // Sort for UX consistency
      }),
      prisma.soleOption.findMany({
        select: { id: true, type: true, height: true },
        orderBy: { type: "asc" }, // Sort for UX consistency
      }),
      prisma.material.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" }, // Sort for UX consistency
      }),
      prisma.color.findMany({
        select: { id: true, name: true, hexCode: true },
        orderBy: { name: "asc" }, // Sort for UX consistency
      }),
      prisma.panel.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: "asc" }, // Sort for UX consistency
      }),
    ]);

    // Return response with metadata and caching
    return NextResponse.json(
      {
        success: true,
        data: {
          sizes,
          styles,
          soles,
          materials,
          colors,
          panels,
        },
        meta: {
          totalSizes: sizes.length,
          totalStyles: styles.length,
          totalSoles: soles.length,
          totalMaterials: materials.length,
          totalColors: colors.length,
          totalPanels: panels.length,
          timestamp: new Date().toISOString(), // Optional metadata
        },
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300", // 5-min cache
        },
      }
    );
  } catch (error) {
    return handleError(error, "Error fetching variant form data");
  } finally {
    // Disconnect Prisma explicitly in non-Edge environments
    if (process.env.NEXT_RUNTIME !== "edge") {
      await prisma.$disconnect();
    }
  }
}