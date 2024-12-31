import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const totalSizeOptions = await prisma.sizeOption.count();

    const sizeOptions = await prisma.sizeOption.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      data: sizeOptions,
      meta: {
        totalItems: totalSizeOptions,
        totalPages: Math.ceil(totalSizeOptions / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalSizeOptions,
    });
  } catch (error) {
    console.error("Error fetching size options:", error);
    return NextResponse.json({ error: "Error fetching size options" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const { sizeSystem, size, width } = formData;

    if (!sizeSystem || !size) {
      return NextResponse.json({ error: "Size system and size are required" }, { status: 400 });
    }

    const newSizeOption = await prisma.sizeOption.create({
      data: { sizeSystem, size, width },
    });

    return NextResponse.json(newSizeOption, { status: 201 });
  } catch (error) {
    console.error("Error creating size option:", error);
    return NextResponse.json({ error: "Error creating size option" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const formData = await req.json();
    const { sizeSystem, size, width } = formData;

    if (!id) {
      return NextResponse.json({ error: "SizeOption ID is required" }, { status: 400 });
    }

    const updatedSizeOption = await prisma.sizeOption.update({
      where: { id: parseInt(id, 10) },
      data: { sizeSystem, size, width },
    });

    return NextResponse.json(updatedSizeOption, { status: 200 });
  } catch (error) {
    console.error("Error updating size option:", error);
    return NextResponse.json({ error: "Error updating size option" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "SizeOption ID is required" }, { status: 400 });
    }

    await prisma.sizeOption.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Size option deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting size option:", error);
    return NextResponse.json({ error: "Error deleting size option" }, { status: 500 });
  }
}
