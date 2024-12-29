import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Fetch total count of colors
    const totalColors = await prisma.color.count();

    // Fetch paginated color data
    const colors = await prisma.color.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      data: colors,
      meta: {
        totalItems: totalColors,
        totalPages: Math.ceil(totalColors / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalColors,
    });
  } catch (error) {
    console.error("Error fetching colors:", error);
    return NextResponse.json({ error: "Error fetching colors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, hexCode } = body;

    if (!name || !hexCode) {
      return NextResponse.json({ error: "Name and Hex Code are required" }, { status: 400 });
    }

    const newColor = await prisma.color.create({
      data: {
        name,
        hexCode,
      },
    });

    return NextResponse.json(newColor, { status: 201 });
  } catch (error) {
    console.error("Error creating color:", error);
    return NextResponse.json({ error: "Error creating color" }, { status: 500 });
  }
}
