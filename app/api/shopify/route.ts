
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type ResponseData = {
  success: boolean;
  data?: any;
  message?: string;
  total?: number;
};

export async function GET(request: Request) {
  try {
    // Extract query parameters for pagination and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10); // Default to page 1
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10); // Default to 10 items per page
    const sortBy = searchParams.get("sortBy") || "createdAt"; // Default sort field
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"; // Default to descending order

    // Calculate offset for pagination
    const skip = (page - 1) * pageSize;

    // Fetch Shopify products with pagination and sorting
    const collections = await prisma.shopifyProduct.findMany({
      skip,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
      where: {
        status: "active",
      }
    });

    // Get total count for pagination
    const total = await prisma.shopifyProduct.count();
    return NextResponse.json({
      data: collections,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: total,
    });


  } catch (error) {
    console.error("Error fetching Shopify products:", (error as Error).message);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
