/**
 * One-time backfill: shrink every colour-texture object under `colors/` on S3.
 *
 * Sources were uploaded as raw photos (one is 20.8MB); the storefront needs at
 * most ~2K for tiling and 64px for swatches, and the Next image optimizer's 7s
 * upstream-fetch timeout trips on the multi-megabyte originals. Each object is
 * re-encoded in place (same key, so no DB changes) as WebP capped at 2048px,
 * with the immutable cache header set. Browsers, sharp, and the Next optimizer
 * all sniff content by MIME/magic bytes, so the stale .jpg/.png extension in
 * the key is harmless.
 *
 * Run with owner AWS credentials (never from the app):
 *   S3_REGION=us-east-1 S3_BUCKET_NAME=italian-shoes-color npx tsx scripts/resize-colors.ts
 *
 * Idempotent: objects already at/below the size threshold are skipped, and a
 * re-run over already-converted WebP output just re-encodes losslessly small.
 */
import {
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getS3Client } from "../lib/s3";

const PREFIX = "colors/";
const MAX_DIMENSION = 2048;
const QUALITY = 82;
/** Objects already smaller than this are left untouched. */
const SKIP_BELOW_BYTES = 400 * 1024;

async function main() {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("S3_BUCKET_NAME is not set");
  const s3 = getS3Client();

  let continuationToken: string | undefined;
  let processed = 0;
  let skipped = 0;
  let savedBytes = 0;

  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
      })
    );
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;

    for (const obj of page.Contents ?? []) {
      const key = obj.Key;
      if (!key || key.endsWith("/")) continue;
      if ((obj.Size ?? 0) < SKIP_BELOW_BYTES) {
        skipped++;
        continue;
      }

      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const original = Buffer.from(await res.Body!.transformToByteArray());

        const resized = await sharp(original)
          .rotate()
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: QUALITY })
          .toBuffer();

        if (resized.length >= original.length) {
          skipped++;
          continue;
        }

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: resized,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        processed++;
        savedBytes += original.length - resized.length;
        console.log(
          `resized ${key}: ${(original.length / 1e6).toFixed(2)}MB -> ${(resized.length / 1e6).toFixed(2)}MB`
        );
      } catch (err) {
        console.error(`FAILED ${key}:`, err instanceof Error ? err.message : err);
      }
    }
  } while (continuationToken);

  console.log(
    `\nDone. Resized ${processed}, skipped ${skipped}, saved ${(savedBytes / 1e6).toFixed(1)}MB total.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
