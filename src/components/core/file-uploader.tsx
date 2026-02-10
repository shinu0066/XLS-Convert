"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { useDropzone, type FileWithPath } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  isSubscribed?: boolean;
  dragText?: string;
  orText?: string;
  clickText?: string;
}

const MAX_FILES_LOGGED_IN = 5;

export default function FileUploader({
  onFilesSelect,
  disabled = false,
  isSubscribed = false,
  dragText = "Drag & drop a PDF file here",
  orText = "or",
  clickText = "Click to select file",
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFilesSelect(acceptedFiles);

        // Reset input value to allow selecting the same file again
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [onFilesSelect]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: isSubscribed ? MAX_FILES_LOGGED_IN : 1,
    multiple: isSubscribed,
    disabled,
    noClick: true, // ✅ button se open() hoga (card click se nahi)
  });

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // reset so same file can be picked again
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      open();
    },
    [open]
  );

  const uploaderText = useMemo(() => {
    return isSubscribed
      ? dragText.replace("a PDF file", `up to ${MAX_FILES_LOGGED_IN} PDF files`)
      : dragText;
  }, [isSubscribed, dragText]);

  // ✅ IMPORTANT: remove `ref` from input props (fixes TS error on Vercel)
  const { ref: _dropzoneRef, ...inputProps } = getInputProps();

  return (
    <Card
      {...getRootProps()}
      className={`border-dashed border-2 hover:border-primary transition-colors 
                  ${isDragActive ? "border-primary bg-primary/10" : "border-input"}
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <CardContent className="p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
        {/* ✅ Use our own ref only */}
        <input {...inputProps} ref={inputRef} />

        <UploadCloud
          className={`h-12 w-12 mb-4 ${
            isDragActive ? "text-primary" : "text-muted-foreground"
          }`}
        />

        {isDragActive ? (
          <p className="text-lg font-semibold text-primary">
            {uploaderText.replace("&", "and")}...
          </p>
        ) : (
          <>
            <p className="text-lg font-semibold text-foreground">{uploaderText}</p>
            <p className="text-muted-foreground mb-4">{orText}</p>

            <Button
              type="button"
              onClick={handleButtonClick}
              variant="outline"
              disabled={disabled}
            >
              {clickText}
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Max file size: 10MB each. PDF only.{" "}
              {isSubscribed && `Max ${MAX_FILES_LOGGED_IN} files.`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
