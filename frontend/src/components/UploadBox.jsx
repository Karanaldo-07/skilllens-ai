import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadBox({ setFile, file, disabled = false }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Please upload a PDF file only");
        } else if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error("File size must be less than 5MB");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        
        // Additional size check
        if (selectedFile.size > MAX_FILE_SIZE) {
          toast.error("File size must be less than 5MB");
          return;
        }

        setFile(selectedFile);
        toast.success("File uploaded successfully");
      }
    },
    [setFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled,
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    toast.success("File removed");
  };

  // File Preview
  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border-2 border-green-500/50 bg-green-500/10 rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              <svg
                className="w-12 h-12 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold truncate">{file.name}</p>
                <span className="text-green-400 text-sm font-medium">
                  ✓ Uploaded
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={handleRemoveFile}
              className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
              aria-label="Remove file"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Upload Box
  return (
    <motion.div
      {...getRootProps()}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-300
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isDragActive
            ? "border-purple-500 bg-purple-500/10 border-solid"
            : "border-gray-600 hover:border-purple-500/50 hover:bg-white/5"
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <svg
          className="w-16 h-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <div>
          <p className="text-lg font-semibold text-white mb-2">
            {isDragActive
              ? "Drop your resume here"
              : "Drag and Drop files"}
          </p>
          <p className="text-sm text-gray-400">
            or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            PDF files only (Max 5MB)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
