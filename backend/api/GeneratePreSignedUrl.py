import json
import boto3
import uuid
from datetime import datetime, timezone
import os

VALID_API_KEY = os.get("VALID_API_KEY")

s3 = boto3.client("s3")
BUCKET_NAME = os.get("BUCKET_NAME")
UPLOAD_PREFIX = os.get("UPLOAD_PREFIX")


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
    except:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Invalid JSON"})
        }

    # 1️. Check API key
    api_key = body.get("apiKey")
    if api_key != VALID_API_KEY:
        return {
            "statusCode": 401,
            "body": json.dumps({"error": "Unauthorized"})
        }

    # 2️. Generate unique S3 key
    filename = body.get("filename", "statement.pdf")
    file_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    s3_key = f"{UPLOAD_PREFIX}/{file_id}-{timestamp}-{filename}"

    # 3️. Generate presigned PUT URL
    content_type = body.get("contentType", "application/pdf")
    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": s3_key,
            "ContentType": content_type
        },
        ExpiresIn=3600  # 1 hour
    )

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "uploadUrl": upload_url,
            "s3Key": s3_key,
            "bucket": BUCKET_NAME
        })
    }
