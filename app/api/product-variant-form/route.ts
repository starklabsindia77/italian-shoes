import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize PrismaClient outside the handler for connection reuse
const prisma = new PrismaClient({
  log: ["error"], // Minimize logging in production
});

// Common error handling function inspired by panel/route.ts
const handleError = (error: any, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
};

// GET: Fetch data for ProductVariant form dropdowns
export async function GET(req: NextRequest) {
  try {
    // Fetch data in parallel
    const [shopifyProducts, variants] = await Promise.all([
      prisma.shopifyProduct.findMany({
        where: { status: "active" },
        select: { id: true, title: true },
        orderBy: { title: "asc" }, // Consistent sorting like panel
      }),
      prisma.variant.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" }, // Consistent sorting like panel
      }),
    ]);

    // Return response with metadata and caching
    return NextResponse.json(
      {
        data: {
          shopifyProducts,
          variants,
        },
        meta: {
          totalShopifyProducts: shopifyProducts.length,
          totalVariants: variants.length,
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
    return handleError(error, "Error fetching product-variant-form data");
  } finally {
    // Disconnect Prisma explicitly in non-Edge environments
    if (process.env.NEXT_RUNTIME !== "edge") {
      await prisma.$disconnect();
    }
  }
}