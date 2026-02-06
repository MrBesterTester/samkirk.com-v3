"use client";

import { useState, useRef, useCallback } from "react";

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; message: string; files: string[] }
  | { status: "error"; message: string };

interface SelectedFile {
  file: File;
  extension: string;
}

const REQUIRED_EXTENSIONS = [".md", ".txt", ".html"];
const ALLOWED_EXTENSIONS = [".md", ".txt", ".html", ".pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return "";
  }
  return filename.slice(lastDot).toLowerCase();
}

function getFormatDisplayName(ext: string): string {
  switch (ext) {
    case ".md":
      return "Markdown";
    case ".txt":
      return "Plain Text";
    case ".html":
      return "HTML";
    case ".pdf":
      return "PDF";
    default:
      return ext;
  }
}

export default function AdminDanceMenuPage() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMissingExtensions = useCallback(() => {
    const selectedExts = selectedFiles.map((f) => f.extension);
    return REQUIRED_EXTENSIONS.filter((ext) => !selectedExts.includes(ext));
  }, [selectedFiles]);

  const handleFilesSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    setUploadState({ status: "idle" });

    const newFiles: SelectedFile[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const ext = getFileExtension(file.name);

      // Validate extension
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`"${file.name}" has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
        continue;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" is too large. Maximum: 10MB`);
        continue;
      }

      // Check for duplicate extension
      const existingIndex = newFiles.findIndex((f) => f.extension === ext);
      if (existingIndex !== -1) {
        // Replace existing file with same extension
        newFiles[existingIndex] = { file, extension: ext };
      } else {
        newFiles.push({ file, extension: ext });
      }
    }

    if (errors.length > 0) {
      setUploadState({
        status: "error",
        message: errors.join(". "),
      });
    }

    // Merge with existing files, replacing duplicates
    setSelectedFiles((prev) => {
      const merged = [...prev];
      for (const newFile of newFiles) {
        const existingIndex = merged.findIndex(
          (f) => f.extension === newFile.extension
        );
        if (existingIndex !== -1) {
          merged[existingIndex] = newFile;
        } else {
          merged.push(newFile);
        }
      }
      return merged;
    });
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFilesSelect(e.dataTransfer.files);
    },
    [handleFilesSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilesSelect(e.target.files);
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFilesSelect]
  );

  const removeFile = useCallback((extension: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.extension !== extension));
    setUploadState({ status: "idle" });
  }, []);

  const handleUpload = async () => {
    const missing = getMissingExtensions();
    if (missing.length > 0) {
      setUploadState({
        status: "error",
        message: `Missing required files: ${missing.map(getFormatDisplayName).join(", ")}`,
      });
      return;
    }

    setUploadState({ status: "uploading" });

    try {
      const formData = new FormData();
      selectedFiles.forEach((f, idx) => {
        formData.append(`file${idx}`, f.file);
      });

      const response = await fetch("/api/admin/dance-menu", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setUploadState({
        status: "success",
        message: data.message || "Dance menu uploaded successfully",
        files: data.uploadedFiles || [],
      });
      setSelectedFiles([]);
    } catch (error) {
      setUploadState({
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const missingExtensions = getMissingExtensions();
  const canUpload = missingExtensions.length === 0 && selectedFiles.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Dance Menu Management
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        Upload and publish the weekly dance menu bundle. Upload files in multiple
        formats (.md, .txt, .html) to publish a new menu.
      </p>

      {/* Upload area */}
      <div className="mt-12">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950/30"
              : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.html,.pdf"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploadState.status === "uploading"}
          />
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Click to upload
              </span>{" "}
              or drag and drop multiple files
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              Required: .md, .txt, .html — Optional: .pdf — Max 10MB per file
            </p>
          </div>
        </div>

        {/* Required files indicator */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ALLOWED_EXTENSIONS.map((ext) => {
            const isRequired = REQUIRED_EXTENSIONS.includes(ext);
            const hasFile = selectedFiles.some((f) => f.extension === ext);

            return (
              <div
                key={ext}
                className={`flex items-center gap-2 rounded-lg border p-3 ${
                  hasFile
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                    : isRequired
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                {hasFile ? (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : isRequired ? (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-11a1 1 0 011 1v3a1 1 0 01-2 0V8a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-zinc-400 dark:text-zinc-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      hasFile
                        ? "text-green-800 dark:text-green-200"
                        : isRequired
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {getFormatDisplayName(ext)}
                  </p>
                  <p
                    className={`text-xs ${
                      hasFile
                        ? "text-green-600 dark:text-green-400"
                        : isRequired
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {hasFile ? "Ready" : isRequired ? "Required" : "Optional"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Selected files ({selectedFiles.length})
            </h3>
            {selectedFiles.map((selected) => (
              <div
                key={selected.extension}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="h-8 w-8 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selected.file.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatFileSize(selected.file.size)} •{" "}
                      {getFormatDisplayName(selected.extension)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(selected.extension)}
                  disabled={uploadState.status === "uploading"}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!canUpload || uploadState.status === "uploading"}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
          >
            {uploadState.status === "uploading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              "Publish Dance Menu"
            )}
          </button>
        </div>

        {/* Status messages */}
        {uploadState.status === "success" && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  {uploadState.message}
                </p>
                {uploadState.files.length > 0 && (
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                    Files: {uploadState.files.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {uploadState.status === "error" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {uploadState.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          About the Dance Menu
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              The dance menu is displayed to visitors and available for download
              in multiple formats.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Upload all three required formats (.md, .txt, .html) to publish.
              PDF is optional.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Publishing replaces the current menu immediately. No versioning is
              kept.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
