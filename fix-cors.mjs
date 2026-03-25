import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY,
    },
});

async function main() {
    try {
        const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
        console.log(`Setting CORS for bucket: ${bucket}`);

        const input = {
            Bucket: bucket,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "HEAD"],
                        AllowedOrigins: ["*"],
                        ExposeHeaders: ["ETag"],
                        MaxAgeSeconds: 3000,
                    },
                ],
            },
        };

        const command = new PutBucketCorsCommand(input);
        const response = await client.send(command);
        console.log("CORS updated successfully:", response);
    } catch (err) {
        console.error("Error setting CORS:", err);
    }
}

main();
