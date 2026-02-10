import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("UPLOAD API HIT");

    const formData = await req.formData();
    const file = formData.get("file");

    console.log("FILE RECEIVED:", file ? "YES" : "NO");

    if (!file) {
      console.error("NO FILE IN REQUEST");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const uploadUrl = process.env.UPLOAD_URL;

    console.log("UPLOAD_URL:", uploadUrl ? "FOUND" : "MISSING");

    if (!uploadUrl) {
      throw new Error("UPLOAD_URL is missing in env");
    }

    const lambdaRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    console.log("LAMBDA STATUS:", lambdaRes.status);

    const text = await lambdaRes.text();
    console.log("LAMBDA RAW RESPONSE:", text);

    if (!lambdaRes.ok) {
      throw new Error(`Lambda failed: ${text}`);
    }

    return new NextResponse(text, {
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (err: any) {
    console.error("UPLOAD API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}