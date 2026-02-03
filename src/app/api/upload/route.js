export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { uploadPdfAndGetCsv } from "../../../../backend/api/api.js";
console.log("UPLOAD_URL =", process.env.UPLOAD_URL);

export async function POST(request) {

  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const downloadUrl = await uploadPdfAndGetCsv(file.name, buffer);

    return NextResponse.json({ downloadUrl });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
