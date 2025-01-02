import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch Variants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const totalVariants = await prisma.variant.count();
    // const variants = await prisma.variant.findMany({
    //   skip: (page - 1) * pageSize,
    //   take: pageSize,
    //   orderBy: { [sortBy]: sortOrder },
    // });

    const variants = await prisma.variant.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        size: true,
        style: true,
        sole: true,
        material: true,
        color: true,
        panel: true,
      },
    });

    return NextResponse.json({
      data: variants,
      meta: {
        totalItems: totalVariants,
        totalPages: Math.ceil(totalVariants / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalVariants,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json({ error: "Error fetching variants" }, { status: 500 });
  }
}

// POST: Create Variant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      sizeOptionId,
      styleOptionId,
      soleOptionId,
      materialId,
      colorId,
      panelId,
    } = body;

    if (!name || !sizeOptionId || !styleOptionId || !soleOptionId || !materialId || !colorId || !panelId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const newVariant = await prisma.variant.create({
      data: {
        name,
        sizeOptionId,
        styleOptionId,
        soleOptionId,
        materialId,
        colorId,
        panelId,
      },
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json({ error: "Error creating variant" }, { status: 500 });
  }
}

// PUT: Update Variant
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    const body = await req.json();
    const {
      name,
      sizeOptionId,
      styleOptionId,
      soleOptionId,
      materialId,
      colorId,
      panelId,
    } = body;

    const updatedVariant = await prisma.variant.update({
      where: { id: id },
      data: {
        name,
        sizeOptionId,
        styleOptionId,
        soleOptionId,
        materialId,
        colorId,
        panelId,
      },
    });

    return NextResponse.json(updatedVariant, { status: 200 });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json({ error: "Error updating variant" }, { status: 500 });
  }
}

// DELETE: Delete Variant
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);

    await prisma.variant.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Variant deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json({ error: "Error deleting variant" }, { status: 500 });
  }
}
