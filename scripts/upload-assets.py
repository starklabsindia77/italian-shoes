#!/usr/bin/env python3
import os
import boto3
from dotenv import load_dotenv
import mimetypes

def upload_assets():
    # Load environment variables from .env
    load_dotenv()
    
    bucket_name = os.getenv('NEXT_PUBLIC_AWS_S3_BUCKET_NAME')
    region = os.getenv('NEXT_PUBLIC_AWS_S3_REGION')
    access_key = os.getenv('NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID')
    secret_key = os.getenv('NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY')
    
    if not all([bucket_name, region, access_key, secret_key]):
        print("Error: Missing S3 configuration in .env")
        return

    s3 = boto3.client(
        's3',
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )
    
    # Directory to scan
    public_dir = 'public'
    
    print(f"Syncing GLB files from {public_dir} to s3://{bucket_name}...")
    
    for root, dirs, files in os.walk(public_dir):
        for file in files:
            if file.endswith('.glb'):
                local_path = os.path.join(root, file)
                # s3_key is the path relative to public/
                s3_key = os.path.relpath(local_path, public_dir)
                
                content_type = mimetypes.guess_type(local_path)[0] or 'model/gltf-binary'
                
                print(f"Uploading {local_path} -> {s3_key} ({content_type})")
                try:
                    s3.upload_file(
                        local_path, 
                        bucket_name, 
                        s3_key,
                        ExtraArgs={'ContentType': content_type}
                    )
                except Exception as e:
                    print(f"Failed to upload {file}: {e}")

    print("Sync complete.")

if __name__ == "__main__":
    upload_assets()
