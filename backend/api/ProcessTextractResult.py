import boto3
import csv
import io
import json

textract = boto3.client("textract")
s3 = boto3.client("s3")

def lambda_handler(event, context):
    # SNS message from Textract
    message = event["Records"][0]["Sns"]["Message"]
    message = json.loads(message)

    job_id = message["JobId"]
    bucket = message["DocumentLocation"]["S3Bucket"]
    key = message["DocumentLocation"]["S3ObjectName"]

    blocks = []
    next_token = None

    while True:
        if next_token:
            response = textract.get_document_analysis(
                JobId=job_id,
                NextToken=next_token
            )
        else:
            response = textract.get_document_analysis(
            JobId=job_id
        )

        blocks.extend(response["Blocks"])
        next_token = response.get("NextToken")

        if not next_token:
            break

    # 2. Index blocks by Id (performance optimization)
    block_map = {b["Id"]: b for b in blocks}

    # 3. Extract all table cells
    cells = [b for b in blocks if b["BlockType"] == "CELL"]

    # pages = { page_number: { row_index: { col_index: text } } }
    pages = {}

    for cell in cells:
        page = cell["Page"]
        row = cell["RowIndex"]
        col = cell["ColumnIndex"]
        text = ""

        if "Relationships" in cell:
            for rel in cell["Relationships"]:
                if rel["Type"] == "CHILD":
                    for cid in rel["Ids"]:
                        word = block_map.get(cid)
                        if word and word["BlockType"] == "WORD":
                            text += word["Text"] + " "

        pages.setdefault(page, {}).setdefault(row, {})[col] = text.strip()

    # 4. Write CSV with page headers
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)

    first_page = True

    for page in sorted(pages):
        if not first_page:
            writer.writerow([])  # blank row between pages
        first_page = False

        # Page header
        writer.writerow([f"--- Page {page} ---"])

        # Page table data
        for row_idx in sorted(pages[page]):
            row = pages[page][row_idx]
            writer.writerow([row.get(i, "") for i in sorted(row)])

    # 5. Save CSV to S3 under processed/
    filename = key.split("/")[-1].replace(".pdf", ".csv")
    csv_key = f"processed/{filename}"

    s3.put_object(
        Bucket=bucket,
        Key=csv_key,
        Body=csv_buffer.getvalue(),
        ContentType="text/csv"
    )

    print("✅ CSV saved to:", csv_key)
    
    return {
        "statusCode": 200,
        "body": json.dumps({
            "bucket": bucket,
            "key": csv_key
        })
    }
