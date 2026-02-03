"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setLoading(false);

    if (data.downloadUrl) {
      setDownloadUrl(data.downloadUrl);
    } else {
      alert("Upload failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Upload PDF</h1>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Upload"}
      </button>

      <br /><br />

      {downloadUrl && (
        <a href={downloadUrl} target="_blank">
          Download CSV
        </a>
      )}
    </div>
  );
}
