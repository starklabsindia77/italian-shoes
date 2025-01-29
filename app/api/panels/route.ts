import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configure common error handling
const handleError = (error: any, message: string, status = 500) => {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status });
};

// GET: Fetch list of panels with pagination and sorting
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const totalPanels = await prisma.panel.count();
    const panels = await prisma.panel.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return NextResponse.json({
      data: panels,
      meta: {
        totalItems: totalPanels,
        totalPages: Math.ceil(totalPanels / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalPanels,
    });
  } catch (error) {
    return handleError(error, "Error fetching panels");
  }
}

// POST: Add a new panel
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Panel name is required" },
        { status: 400 }
      );
    }

    const newPanel = await prisma.panel.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(newPanel, { status: 201 });
  } catch (error) {
    return handleError(error, "Error creating panel");
  }
}

// PUT: Update a panel by ID
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Panel ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;

    const updatedPanel = await prisma.panel.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    return NextResponse.json(updatedPanel, { status: 200 });
  } catch (error) {
    return handleError(error, "Error updating panel");
  }
}

// DELETE: Delete a panel by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Panel ID is required" },
        { status: 400 }
      );
    }

    await prisma.panel.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Panel deleted successfully" });
  } catch (error) {
    return handleError(error, "Error deleting panel");
  }
}
