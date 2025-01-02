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

    const totalMaterials = await prisma.material.count();

    const materials = await prisma.material.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      data: materials,
      meta: {
        totalItems: totalMaterials,
        totalPages: Math.ceil(totalMaterials / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalMaterials,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "Error fetching materials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    const { name, description } = formData;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newMaterial = await prisma.material.create({
      data: { name, description },
    });

    return NextResponse.json(newMaterial, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json({ error: "Error creating material" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    const formData = await req.json();
    const { name, description } = formData;

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    const updatedMaterial = await prisma.material.update({
      where: { id: id },
      data: { name, description },
    });

    return NextResponse.json(updatedMaterial, { status: 200 });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json({ error: "Error updating material" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);

    if (!id) {
      return NextResponse.json({ error: "Material ID is required" }, { status: 400 });
    }

    await prisma.material.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Material deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "Error deleting material" }, { status: 500 });
  }
}
