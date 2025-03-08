import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Force dynamic behavior and disable revalidation (caching)
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

const handleError = (error: unknown, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ success: false, error: message }, { status });
};

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching data at:", new Date().toISOString());

    // Fetch all data concurrently
    const [colors, sizes, soles, materials, styles, panels] = await Promise.all([
      prisma.color.findMany(),
      prisma.sizeOption.findMany(),
      prisma.soleOption.findMany(),
      prisma.material.findMany(),
      prisma.styleOption.findMany(),
      prisma.panel.findMany(),
    ]);

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

    // Disable caching by setting these headers
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    return handleError(error, "Error fetching variant form data");
  } finally {
    await prisma.$disconnect();
  }
}
