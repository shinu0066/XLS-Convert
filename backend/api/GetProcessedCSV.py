import boto3
import json
import os

s3 = boto3.client("s3")

API_KEY = "6w0nI1LpJy2Fy7uVn8RU"

PRESIGNED_EXPIRY = 300  # 5 minutes

def lambda_handler(event, context):
    """
    Expects JSON body:
    {
        "apiKey": "YOUR_12_CHAR_KEY",
        "bucket": "your-bucket-name",
        "key": "processed/sample.csv"
    }
    """
    # Parse request body
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return {"statusCode": 400, "body": "Invalid JSON"}

    # Validate API key
    if body.get("apiKey") != API_KEY:
        return {"statusCode": 401, "body": "Unauthorized"}

    bucket = body.get("bucket")
    key = body.get("key")

    if not bucket or not key:
        return {"statusCode": 400, "body": "Missing bucket or key"}

    # Check if object exists
    try:
        s3.head_object(Bucket=bucket, Key=key)
    except s3.exceptions.NoSuchKey:
        return {
            "statusCode": 404,
            "body": json.dumps({"status": "NOT_FOUND"})
        }

    # Generate presigned GET URL
    download_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": bucket,
            "Key": key,
            "ResponseContentDisposition": f'attachment; filename="{key.split("/")[-1]}"'
        },
        ExpiresIn=PRESIGNED_EXPIRY
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "status": "READY",
            "downloadUrl": download_url
        })
    }
