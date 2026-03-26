import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getS3Client() {
    if (client) return client;

    if (!process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY || !process.env.NEXT_PUBLIC_AWS_S3_REGION) {
        throw new Error("Missing S3 configuration in environment variables");
    }

    client = new S3Client({
        region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
        },
    });

    return client;
}
