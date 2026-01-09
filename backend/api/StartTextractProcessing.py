import boto3
import os

textract = boto3.client("textract")

SNS_TOPIC_ARN = "arn:aws:sns:eu-west-2:953331331470:TextractJobComplete"
ROLE_ARN = "arn:aws:iam::953331331470:role/Textract-Role"

def lambda_handler(event, context):
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]

    response = textract.start_document_analysis(
        DocumentLocation={
            "S3Object": {
                "Bucket": bucket,
                "Name": key
            }
        },
        FeatureTypes=["TABLES"],
        NotificationChannel={
            "SNSTopicArn": SNS_TOPIC_ARN,
            "RoleArn": ROLE_ARN
        }
    )

    print("Textract Job Started:", response["JobId"])
