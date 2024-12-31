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
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const hexCode = formData.get("hexCode") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!name || !hexCode || !imageFile) {
      return NextResponse.json({
        error: "Name, Hex Code, and Image are required",
      }, { status: 400 });
    }

    // Convert the File object to a buffer for Cloudinary upload
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Upload image to Cloudinary
    const imageUploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream({
        folder: "colors",
      }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });

      // Pipe the buffer to the upload stream
      uploadStream.end(imageBuffer);
    });

    const newColor = await prisma.color.create({
      data: {
        name,
        hexCode,
        imageUrl: (imageUploadResponse as any).secure_url,
      },
    });

    return NextResponse.json(newColor, { status: 201 });
  } catch (error) {
    console.error("Error creating color:", error);
    return NextResponse.json({ error: "Error creating color" }, { status: 500 });
  }
}

export async function GET_SINGLE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Color ID is required" }, { status: 400 });
    }

    const color = await prisma.color.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!color) {
      return NextResponse.json({ error: "Color not found" }, { status: 404 });
    }

    return NextResponse.json(color, { status: 200 });
  } catch (error) {
    console.error("Error fetching color:", error);
    return NextResponse.json({ error: "Error fetching color" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const hexCode = formData.get("hexCode") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!id) {
      return NextResponse.json({ error: "Color ID is required" }, { status: 400 });
    }

    let imageUrl;
    if (imageFile) {
      // Convert the File object to a buffer for Cloudinary upload
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

      // Upload image to Cloudinary
      const imageUploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream({
          folder: "colors",
        }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });

        // Pipe the buffer to the upload stream
        uploadStream.end(imageBuffer);
      });

      imageUrl = (imageUploadResponse as any).secure_url;
    }

    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (hexCode) updatedData.hexCode = hexCode;
    if (imageUrl) updatedData.imageUrl = imageUrl;

    const updatedColor = await prisma.color.update({
      where: { id: parseInt(id, 10) },
      data: updatedData,
    });

    return NextResponse.json(updatedColor, { status: 200 });
  } catch (error) {
    console.error("Error updating color:", error);
    return NextResponse.json({ error: "Error updating color" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Color ID is required" }, { status: 400 });
    }

    await prisma.color.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Color deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting color:", error);
    return NextResponse.json({ error: "Error deleting color" }, { status: 500 });
  }
}
