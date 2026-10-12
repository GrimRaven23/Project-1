import { NextRequest, NextResponse } from "next/server";
import { DatabaseRepository } from "@/core/storage/database";
import { ApiGuard } from "@/core/security/api-guard";
import { CaseDocument } from "@/core/domain/types";
import { AuditService } from "@/core/audit/audit-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = ApiGuard.authenticate(request);
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const currentCase = DatabaseRepository.getCaseById(params.id);
  if (!currentCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { fileName, fileSizeBytes, mimeType } = body;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    // Security validation on file extension
    const allowedExtensions = [".pdf", ".docx", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg"];
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `File type '${ext}' rejected. Only enterprise business documents (PDF, DOCX, XLSX, CSV, images) are accepted.` },
        { status: 400 }
      );
    }

    // Size limit check (max 25MB)
    if (fileSizeBytes && fileSizeBytes > 25 * 1024 * 1024) {
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
      sizeBytes: fileSizeBytes || 1024 * 50,
      mimeType: mimeType || "application/pdf",
      uploadedByUserId: user.id,
      uploadedByUserName: user.name,
      uploadedAt: new Date().toISOString(),
      scanStatus: "CLEAN",
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
      newState: { fileName }
    });

    return NextResponse.json({ data: documentRecord, updatedCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
