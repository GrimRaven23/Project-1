"use client";

import React, { useState } from "react";
import { CaseDocument } from "@/core/domain/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UploadCloud, FileText, CheckCircle2, ShieldAlert, Sparkles, Eye } from "lucide-react";

interface DocumentUploaderProps {
  documents: CaseDocument[];
  onUpload: (file: File) => void;
  onValidateExtraction: (docId: string) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  onUpload,
  onValidateExtraction
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300"
        }`}
      >
        <UploadCloud className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          Upload Customer Specifications or RFP Document
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Supports PDF, DOCX, XLSX up to 25MB. Files are sanitized and scanned before intake.
        </p>
        <label className="cursor-pointer">
          <Button type="button" variant="primary" size="sm" className="pointer-events-none">
            Browse Files
          </Button>
          <input
            type="file"
            accept=".pdf,.docx,.xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUpload(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Attached Customer Documents ({documents.length})
        </h4>

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{doc.originalFilename}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  <span>•</span>
                  <span>Uploaded by {doc.uploadedByUserName} on {formatDate(doc.uploadedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Malware Scan Clean
              </span>

              {doc.extractionStatus === "EXTRACTED_DRAFT" && (
                <Button
                  size="sm"
                  variant="telecom"
                  onClick={() => onValidateExtraction(doc.id)}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Validate Extracted RFP Data
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
