import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Fetch all sole options with pagination and sorting
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

    const totalSoleOptions = await prisma.soleOption.count();
    const soleOptions = await prisma.soleOption.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
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

// POST: Add a new sole option
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const height = formData.get("height") as string;
    const imageFile = formData.get("imageFile") as File | null;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ folder: "sole-options" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(imageBuffer);
      });
      imageUrl = (uploadResult as any).secure_url;
    }

    const newSoleOption = await prisma.soleOption.create({
      data: { type, height, imageUrl },
    });

    return NextResponse.json(newSoleOption, { status: 201 });
  } catch (error) {
    console.error("Error creating sole option:", error);
    return NextResponse.json({ error: "Error creating sole option" }, { status: 500 });
  }
}

// PUT: Update an existing sole option
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10); // Default to 0 to trigger validation
    const formData = await req.formData();
    const type = formData.get("type") as string;
    const height = formData.get("height") as string;
    const imageFile = formData.get("imageFile") as File | null;

    if (!id) {
      return NextResponse.json({ error: "SoleOption ID is required" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ folder: "sole-options" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(imageBuffer);
      });
      imageUrl = (uploadResult as any).secure_url;
    }

    const updatedData: any = { type };
    if (height !== undefined) updatedData.height = height; // Allow partial updates
    if (imageUrl) updatedData.imageUrl = imageUrl;

    const updatedSoleOption = await prisma.soleOption.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedSoleOption, { status: 200 });
  } catch (error) {
    console.error("Error updating sole option:", error);
    return NextResponse.json({ error: "Error updating sole option" }, { status: 500 });
  }
}

// DELETE: Remove a sole option
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0", 10); // Default to 0 to trigger validation

    if (!id) {
      return NextResponse.json({ error: "SoleOption ID is required" }, { status: 400 });
    }

    await prisma.soleOption.delete({ where: { id } });

    return NextResponse.json({ message: "Sole option deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting sole option:", error);
    return NextResponse.json({ error: "Error deleting sole option" }, { status: 500 });
  }
}