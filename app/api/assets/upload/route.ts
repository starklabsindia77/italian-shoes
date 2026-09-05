import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getS3Client } from "@/lib/s3";
import { ok, bad, server, requirePermission } from "@/lib/api-helpers";

/** `folder` arrives from the client, so it is matched against a fixed set
 *  rather than interpolated into the S3 key directly. */
const ALLOWED_FOLDERS = ["GLB", "thumbnail", "colors"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const MODEL_TYPES = ["model/gltf-binary", "application/octet-stream"];
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"];

const ALLOWED_TYPES_BY_FOLDER: Record<AllowedFolder, string[]> = {
  GLB: MODEL_TYPES,
  thumbnail: IMAGE_TYPES,
  colors: IMAGE_TYPES,
};

const ALLOWED_EXTENSIONS_BY_FOLDER: Record<AllowedFolder, string[]> = {
  GLB: [".glb", ".gltf"],
  thumbnail: [".png", ".jpg", ".jpeg", ".webp", ".avif"],
  colors: [".png", ".jpg", ".jpeg", ".webp", ".avif"],
};

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 50) || 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Strip directory components and anything outside a safe character set. */
function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "asset";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned.slice(0, 120) || "asset";
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("products.manage");

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) return bad("S3 bucket is not configured", 500);

    const { searchParams } = new URL(req.url);
    const folderParam = searchParams.get("folder") ?? "GLB";
    if (!ALLOWED_FOLDERS.includes(folderParam as AllowedFolder)) {
      return bad(`Invalid folder. Expected one of: ${ALLOWED_FOLDERS.join(", ")}`);
    }
    const folder = folderParam as AllowedFolder;

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return bad("No file provided");

    if (file.size === 0) return bad("File is empty");
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return bad(`File exceeds the ${MAX_FILE_SIZE_MB}MB limit`, 413);
    }

    const fileName = sanitizeFileName(file.name);
    const extension = fileName.includes(".")
      ? `.${fileName.split(".").pop()!.toLowerCase()}`
      : "";

    if (!ALLOWED_EXTENSIONS_BY_FOLDER[folder].includes(extension)) {
      return bad(
        `Invalid file type for "${folder}". Allowed: ${ALLOWED_EXTENSIONS_BY_FOLDER[folder].join(", ")}`
      );
    }
    // Browsers sometimes send an empty or generic type for .glb, so the
    // extension check above is the authoritative one.
    if (file.type && !ALLOWED_TYPES_BY_FOLDER[folder].includes(file.type)) {
      return bad(`Unexpected content type "${file.type}" for "${folder}"`);
    }

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());

    // Compress .glb uploads (meshopt + WebP textures) so the storefront viewer
    // never downloads a raw multi-megabyte export. Best-effort: a model the
    // optimizer cannot parse is stored as uploaded. (.gltf is skipped — it may
    // reference external files the optimizer cannot resolve here.)
    if (folder === "GLB" && extension === ".glb") {
      try {
        const { optimizeGlb } = await import("@/lib/glb-optimize");
        const optimized = await optimizeGlb(buffer);
        if (optimized.length > 0 && optimized.length < buffer.length) {
          console.log(
            `GLB optimized: ${fileName} ${buffer.length} -> ${optimized.length} bytes`
          );
          buffer = optimized;
        }
      } catch (err) {
        console.error(`GLB optimization failed for ${fileName}; storing original`, err);
      }
    }

    const s3Key = `${folder}/${uuidv4()}-${fileName}`;

    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || (folder === "GLB" ? "model/gltf-binary" : "application/octet-stream"),
        // Keys are uuid-prefixed, so every upload is a new URL — safe to mark
        // immutable. Served as the object's Cache-Control header.
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // Relative path; resolved against CloudFront by getAssetUrl().
    return ok({ url: `/${s3Key}`, name: fileName });
  } catch (e) {
    return server(e);
  }
}
