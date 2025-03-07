import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient instance for connection reuse (optimized for production)


// Common error handling function (consistent with your inspiration)
const handleError = (error: unknown, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
};

// GET: Fetch data for ProductVariant form dropdowns
export async function GET(req: NextRequest) {
  const prisma = new PrismaClient({
    log: ["error"], // Minimize logging in production
  });

  
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
    const response = {
      data: { shopifyProducts, variants },
      meta: {
        totalShopifyProducts: shopifyProducts.length,
        totalVariants: variants.length,
        timestamp: new Date().toISOString(),
      },
    };

    // Return response with no caching to ensure fresh data
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    return handleError(error, "Error fetching product-variant-form data");
  } finally {
    // Disconnect only in non-Edge environments (consistent with previous code)
    if (process.env.NEXT_RUNTIME !== "edge") {
      await prisma.$disconnect();
    }
  }
}

// Optional: Export config for Next.js (if needed for Edge runtime)
export const config = {
  runtime: process.env.NEXT_RUNTIME === "edge" ? "edge" : "nodejs",
};