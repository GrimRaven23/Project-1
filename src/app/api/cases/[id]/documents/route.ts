import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { CaseDocument } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";

/**
 * POST /api/cases/[id]/documents — record an uploaded case document.
 *
 * SECURITY: requires `documents:upload` plus case access. The filename is
 * validated against path separators and control characters because it is echoed
 * back to clients and would later be used as a filesystem path.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = ApiGuard.verifyAccess(request, "documents:upload");
  if (guard instanceof NextResponse) return guard;
  const user = guard.user;

  const currentCase = DatabaseRepository.getCaseById(id);
  if (!currentCase || !ApiGuard.canAccessCase(user, currentCase)) {
    return ApiGuard.notFound("Case");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiGuard.badRequest("Request body must be valid JSON");
  }

  const { fileName, fileSizeBytes, mimeType } = body as Record<string, unknown>;

  if (!fileName || typeof fileName !== "string") {
    return ApiGuard.badRequest("fileName is required");
  }

  // Reject path separators and control characters (NUL, CR, LF, DEL, ESC).
  // eslint-disable-next-line no-control-regex
  if (/[\\/]/.test(fileName) || /[\x00-\x1f\x7f]/.test(fileName) || fileName.length > 255) {
    return ApiGuard.badRequest("fileName must not contain path separators or control characters");
  }

  // Security validation on file extension
  const allowedExtensions = [".pdf", ".docx", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg"];
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (!allowedExtensions.includes(ext)) {
    return NextResponse.json(
      {
        error: `File type '${ext}' rejected. Only enterprise business documents (PDF, DOCX, XLSX, CSV, images) are accepted.`
      },
      { status: 400 }
    );
  }

  const size = typeof fileSizeBytes === "number" ? fileSizeBytes : 1024 * 50;
  if (!Number.isFinite(size) || size < 0) {
    return ApiGuard.badRequest("fileSizeBytes must be a non-negative number");
  }

  // Size limit check (max 25MB)
  if (size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File exceeds 25MB enterprise upload limit." },
      { status: 400 }
    );
  }

  const documentRecord: CaseDocument = {
    id: `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    caseId: currentCase.id,
    filename: fileName,
    originalFilename: fileName,
    sizeBytes: size,
    mimeType: typeof mimeType === "string" && mimeType ? mimeType : "application/pdf",
    uploadedByUserId: user.id,
    uploadedByUserName: user.name,
    uploadedAt: new Date().toISOString(),
    // INTEGRITY: never claim a file is virus-scanned clean before a scanner has
    // actually inspected it. Anything newly recorded starts as PENDING_SCAN.
    scanStatus: "PENDING_SCAN",
    extractionStatus: "NONE"
  };

  const updatedDocuments = [...(currentCase.documents || []), documentRecord];
  const updatedCase = DatabaseRepository.saveCase(
    {
      ...currentCase,
      documents: updatedDocuments
    },
    user
  );

  AuditService.logEvent({
    caseId: currentCase.id,
    caseNumber: currentCase.caseNumber,
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: "DOCUMENT_UPLOADED",
    resource: "CaseDocument",
    resourceId: documentRecord.id,
    newState: { fileName, sizeBytes: size }
  });

  return NextResponse.json({ data: documentRecord, updatedCase }, { status: 201 });
}
