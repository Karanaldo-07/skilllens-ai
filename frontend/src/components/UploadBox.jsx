import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function UploadBox({
  setFile,
  file,
  jd = "",
  setJd,
  jobRole = "",
  setJobRole,
  loading = false,
  loadingMessage = "Parsing resume",
  onAnalyze,
}) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles?.length) {
        const errors = rejectedFiles[0].errors || [];
        if (errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Please upload a PDF file only");
        } else if (errors.some((e) => e.code === "file-too-large")) {
          toast.error("File size must be less than 5MB");
        } else {
          toast.error("Unable to upload this file");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (selectedFile.size > MAX_FILE_SIZE) {
          toast.error("File size must be less than 5MB");
          return;
        }
        setFile(selectedFile);
        toast.success("Resume uploaded successfully");
      }
    },
    [setFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: loading,
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setFile(null);
    toast.success("Resume removed");
  };

  return (
    <div className="space-y-6">
      {file ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-2 border-green-500/50 bg-green-500/10 rounded-xl p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <svg className="w-12 h-12 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">{formatFileSize(file.size)} • PDF ready</p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition flex-shrink-0"
                aria-label="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          {...getRootProps()}
          whileHover={loading ? {} : { scale: 1.01 }}
          whileTap={loading ? {} : { scale: 0.99 }}
          className={`border-2 border-dashed rounded-xl p-10 sm:p-12 text-center transition-all duration-300 ${
            loading
              ? "opacity-50 cursor-not-allowed border-gray-700"
              : isDragActive
              ? "border-purple-500 bg-purple-500/10 border-solid cursor-copy"
              : "border-gray-600 hover:border-purple-500/50 hover:bg-white/5 cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-lg font-semibold text-white mb-2">
                {isDragActive ? "Drop your resume here" : "Drag and Drop your resume"}
              </p>
              <p className="text-sm text-gray-400">or click to browse</p>
              <p className="text-xs text-gray-500 mt-2">PDF files only (Max 5MB)</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 space-y-4">
        <div>
          <label htmlFor="job-role" className="block text-sm font-semibold text-gray-200 mb-2">
            Target job role <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="job-role"
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole?.(e.target.value)}
            disabled={loading}
            placeholder="e.g. Software Engineer"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-purple-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="job-description" className="block text-sm font-semibold text-gray-200 mb-2">
            Job description <span className="text-red-400">*</span>
          </label>
          <textarea
            id="job-description"
            value={jd}
            onChange={(e) => setJd?.(e.target.value)}
            disabled={loading}
            rows={7}
            placeholder="Paste the job description here so SkillLens can compare your resume with the role requirements..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-gray-500 outline-none resize-y focus:border-purple-500 disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading || !file || !jd.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3.5 font-bold text-white transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? `${loadingMessage}...` : "Analyze My Resume"}
        </button>

        {!file && !loading && (
          <p className="text-center text-xs text-gray-500">Upload your PDF resume first.</p>
        )}
        {file && !jd.trim() && !loading && (
          <p className="text-center text-xs text-gray-500">Paste the job description to start the analysis.</p>
        )}
      </div>
    </div>
  );
}
