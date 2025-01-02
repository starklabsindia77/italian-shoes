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

    const totalSoleOptions = await prisma.soleOption.count();

    const soleOptions = await prisma.soleOption.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      data: soleOptions,
      meta: {
        totalItems: totalSoleOptions,
        totalPages: Math.ceil(totalSoleOptions / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalSoleOptions,
    });
  } catch (error) {
    console.error("Error fetching sole options:", error);
    return NextResponse.json({ error: "Error fetching sole options" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const { type, height } = formData;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const newSoleOption = await prisma.soleOption.create({
      data: { type, height },
    });

    return NextResponse.json(newSoleOption, { status: 201 });
  } catch (error) {
    console.error("Error creating sole option:", error);
    return NextResponse.json({ error: "Error creating sole option" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    const formData = await req.json();
    const { type, height } = formData;

    if (!id) {
      return NextResponse.json({ error: "SoleOption ID is required" }, { status: 400 });
    }

    const updatedSoleOption = await prisma.soleOption.update({
      where: { id: id },
      data: { type, height },
    });

    return NextResponse.json(updatedSoleOption, { status: 200 });
  } catch (error) {
    console.error("Error updating sole option:", error);
    return NextResponse.json({ error: "Error updating sole option" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);

    if (!id) {
      return NextResponse.json({ error: "SoleOption ID is required" }, { status: 400 });
    }

    await prisma.soleOption.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Sole option deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sole option:", error);
    return NextResponse.json({ error: "Error deleting sole option" }, { status: 500 });
  }
}
