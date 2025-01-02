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

// GET: Fetch all style options with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const totalStyleOptions = await prisma.styleOption.count();
    const styleOptions = await prisma.styleOption.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: styleOptions,
      meta: {
        totalItems: totalStyleOptions,
        totalPages: Math.ceil(totalStyleOptions / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
      total: totalStyleOptions,
    });
  } catch (error) {
    console.error("Error fetching style options:", error);
    return NextResponse.json({ error: "Error fetching style options" }, { status: 500 });
  }
}

// POST: Add a new style option
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ folder: "style-options" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(imageBuffer);
      });
      imageUrl = (uploadResult as any).secure_url;
    }

    const newStyleOption = await prisma.styleOption.create({
      data: { name, imageUrl },
    });

    return NextResponse.json(newStyleOption, { status: 201 });
  } catch (error) {
    console.error("Error creating style option:", error);
    return NextResponse.json({ error: "Error creating style option" }, { status: 500 });
  }
}

// PUT: Update an existing style option
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!id) {
      return NextResponse.json({ error: "StyleOption ID is required" }, { status: 400 });
    }

    let imageUrl = null;
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ folder: "style-options" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(imageBuffer);
      });
      imageUrl = (uploadResult as any).secure_url;
    }

    const updatedData: any = { name };
    if (imageUrl) updatedData.imageUrl = imageUrl;

    const updatedStyleOption = await prisma.styleOption.update({
      where: { id: id },
      data: updatedData,
    });

    return NextResponse.json(updatedStyleOption, { status: 200 });
  } catch (error) {
    console.error("Error updating style option:", error);
    return NextResponse.json({ error: "Error updating style option" }, { status: 500 });
  }
}

// DELETE: Remove a style option
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "1", 10);

    if (!id) {
      return NextResponse.json({ error: "StyleOption ID is required" }, { status: 400 });
    }

    await prisma.styleOption.delete({ where: { id: id } });

    return NextResponse.json({ message: "StyleOption deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting style option:", error);
    return NextResponse.json({ error: "Error deleting style option" }, { status: 500 });
  }
}
