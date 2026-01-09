import 'dotenv/config';
import fs from "fs";
import fetch from "node-fetch";

const UPLOAD_KEY = process.env.UPLOAD_API_KEY;
const DOWNLOAD_KEY = process.env.DOWNLOAD_API_KEY;

const UPLOAD_URL = process.env.UPLOAD_URL;
const DOWNLOAD_URL = process.env.DOWNLOAD_URL

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pdfKeyToCsv(key) {
  if (!key) throw new Error("Invalid key");

  // Replace folder and extension
  const csvKey = key
    .replace(/^uploads\//, "processed/") 
    .replace(/\.pdf$/i, ".csv");    

  return csvKey;
}

async function uploadPDF() {
  const pdfPath = "/Users/apple/Desktop/pdf-to-csv/XLS-Convert/backend/statements/doc-statement.pdf";

  // Read PDF from disk
  const pdfBuffer = fs.readFileSync(pdfPath);

  // Step 1: Get presigned upload URL
  const response = await fetch(`${UPLOAD_URL}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey: `${UPLOAD_KEY}`,
        filename: "doc_statement.pdf"
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  const { uploadUrl, s3Key, bucket } = await response.json();

  // Step 2: Upload PDF directly to S3
  const uploadResult = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf"
    },
    body: pdfBuffer
  });

  if (!uploadResult.ok) {
    throw new Error("S3 upload failed");
  }

  return { bucket: bucket, key: s3Key }
}

async function getDownloadURL(bucket, key) {
  try {
    const response = await fetch(`${DOWNLOAD_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: DOWNLOAD_KEY,
        bucket: bucket,
        key: key
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Download request failed: ${response.status} ${text}`);
    }

    const data = await response.json();

    // Handle different Lambda statuses
    switch (data.status) {
      case "READY":
        return data.downloadUrl;

      case "NOT_FOUND":
        throw new Error(`File not found: ${key}`);

      case "FORBIDDEN":
        throw new Error(`Access denied to file: ${key}.`);

      case "ERROR":
        throw new Error(`Processing returned error: ${data.message || "Unknown error"}`);

      default:
        throw new Error(`Unexpected status from file processor: ${data.status}`);
    }
  } catch (err) {
    // Re-throw to handle retries in runFlow
    throw err;
  }
}


async function runFlow() {
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 20000; // retry every 20 seconds for transient states

  const { bucket, key } = await uploadPDF();
  const csvKey = pdfKeyToCsv(key);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const downloadUrl = await getDownloadURL(bucket, csvKey);
      console.log("✅ Download URL ready:", downloadUrl);
      return downloadUrl;

    } catch (err) {
      // If the error is permanent, stop retrying
      if (
        err.message.includes("File not found") ||
        err.message.includes("Access denied") ||
        err.message.includes("Processing returned error")
      ) {
        throw new Error(`Some error occured: ${err.message}`);
      }

      // Otherwise, retry after delay
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error(`Failed to get download URL for ${csvKey} after ${MAX_RETRIES} attempts`);
}
// Entrypoint - Call the function below to access the API.

// Run the flow
runFlow().catch(err => {
  console.error("Flow failed:", err);
});


