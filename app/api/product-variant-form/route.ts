import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch data for ProductVariant form dropdowns
export async function GET(req: NextRequest) {
  try {
    // Fetch Shopify Products and Variants in parallel for performance
    const [shopifyProducts, variants] = await Promise.all([
      prisma.shopifyProduct.findMany({
        select: {
          id: true,
          title: true,
        },
        where: {
          status: "active",
        },
      }),
      prisma.variant.findMany({
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    // Return the combined data
    return NextResponse.json({
      data: {
        shopifyProducts,
        variants,
      },
    });
  } catch (error) {
    console.error("Error fetching product-variant-form data:", error);
    return NextResponse.json(
      { error: "Failed to fetch product-variant-form data" },
      { status: 500 }
    );
  }
}
