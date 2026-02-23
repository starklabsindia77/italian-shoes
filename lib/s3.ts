import { S3Client } from "@aws-sdk/client-s3";

if (!process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY || !process.env.NEXT_PUBLIC_AWS_S3_REGION) {
    throw new Error("Missing S3 configuration in environment variables");
}

export const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    },
});
