import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Force dynamic behavior and disable revalidation
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Create a singleton PrismaClient instance (optimized for production)
const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

// Common error handling function
const handleError = (error: unknown, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
};

// GET: Fetch data for ProductVariant form dropdowns
export async function GET(req: NextRequest) {
  try {
    // Fetch data in parallel with minimal fields and fresh queries
    const [shopifyProducts, variants] = await Promise.all([
      prisma.shopifyProduct.findMany({
        where: { status: "active" },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
      prisma.variant.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Construct response object
    const responseData = {
      data: { shopifyProducts, variants },
      meta: {
        totalShopifyProducts: shopifyProducts.length,
        totalVariants: variants.length,
        timestamp: new Date().toISOString(),
      },
    };

    // Return response with no caching to ensure fresh data
    const response = NextResponse.json(responseData);
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    return handleError(error, "Error fetching product-variant-form data");
  } finally {
    // When using a singleton, it's best to keep the connection open for reuse.
    // In non-Edge environments, you might choose not to disconnect on every request.
    // if (process.env.NEXT_RUNTIME !== "edge") {
    //   await prisma.$disconnect();
    // }
    await prisma.$disconnect();
  }
}
