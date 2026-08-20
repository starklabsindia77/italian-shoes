import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

// No static credentials, on purpose. The SDK's default provider chain
// resolves credentials from the environment: on EC2 that is the instance
// role (via IMDSv2), locally it is `aws configure` / standard AWS_* vars.
// The old NEXT_PUBLIC_AWS_S3_* key pair leaked with the compromised
// instances and the NEXT_PUBLIC_ prefix risked inlining the secret into
// the public browser bundle — never reintroduce it.
export function getS3Client() {
    if (client) return client;

    const region = process.env.S3_REGION;
    if (!region) {
        throw new Error("S3_REGION is not set");
    }

    client = new S3Client({ region });

    return client;
}
