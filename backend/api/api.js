import "dotenv/config";
import fetch from "node-fetch";

/**
 * Upload a PDF and return the processed CSV download URL
 * @param {string} filename - original PDF filename (e.g. "statement.pdf")
 * @param {Buffer|Uint8Array|ReadableStream} file - PDF file content
 * @returns {Promise<string>} download URL for CSV
 */
export async function uploadPdfAndGetCsv(filename, file) {
  const UPLOAD_KEY = process.env.UPLOAD_API_KEY;
  const DOWNLOAD_KEY = process.env.DOWNLOAD_API_KEY;
  const UPLOAD_URL = process.env.UPLOAD_URL;
  const DOWNLOAD_URL = process.env.DOWNLOAD_URL;

  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 20_000;

  if (!filename || !file) {
    throw new Error("filename and file are required");
  }

  /* ------------------ helpers ------------------ */

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const pdfKeyToCsv = (key) =>
    key.replace(/^uploads\//, "processed/").replace(/\.pdf$/i, ".csv");

  const uploadPDF = async () => {
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: UPLOAD_KEY,
        filename
      })
    });

    if (!res.ok) {
      throw new Error("Failed to get presigned upload URL");
    }

    const { uploadUrl, s3Key, bucket } = await res.json();

    const upload = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: file
    });

    if (!upload.ok) {
      throw new Error("S3 upload failed");
    }

    return { bucket, key: s3Key };
  };

  const getDownloadURL = async (bucket, key) => {
    const res = await fetch(DOWNLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: DOWNLOAD_KEY,
        bucket,
        key
      })
    });

    if (!res.ok) {
      throw new Error(`Download request failed: ${res.status}`);
    }

    const data = await res.json();

    switch (data.status) {
      case "READY":
        return data.downloadUrl;
      case "NOT_FOUND":
        throw new Error("File not found");
      case "FORBIDDEN":
        throw new Error("Access denied");
      case "ERROR":
        throw new Error(data.message || "Processing error");
      default:
        throw new Error(`Unexpected status: ${data.status}`);
    }
  };

  /* ------------------ main flow ------------------ */

  const { bucket, key } = await uploadPDF();
  const csvKey = pdfKeyToCsv(key);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await getDownloadURL(bucket, csvKey);
    } catch (err) {
      if (
        err.message.includes("not found") ||
        err.message.includes("denied") ||
        err.message.includes("Processing")
      ) {
        throw err;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw new Error("Timed out waiting for CSV processing");
}



