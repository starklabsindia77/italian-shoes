import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        // Get folder from query params, default to "GLB"
        const { searchParams } = new URL(req.url);
        const folder = searchParams.get("folder") || "GLB";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;

        // Create a unique name to avoid collisions
        const uniqueFileName = `${uuidv4()}-${fileName}`;
        const s3Key = `${folder}/${uniqueFileName}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME,
                Key: s3Key,
                Body: buffer,
                ContentType: file.type || "model/gltf-binary",
            })
        );

        // Return the relative path that will be used with getAssetUrl
        return NextResponse.json({
            url: `/${s3Key}`,
            name: fileName
        });
    } catch (error) {
        console.error("S3 Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
