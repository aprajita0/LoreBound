import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "world-sources";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export type SourceType =
  | "manuscript"
  | "world_bible"
  | "reference_notes"
  | "other";

export type ImportMode =
  | "analyze_only"
  | "import_only"
  | "import_and_analyze";

export type SourceDocumentStatus =
  | "uploading"
  | "uploaded"
  | "parsing"
  | "ready"
  | "failed"
  | "archived";

export interface SourceDocument {
  id: string;
  worldId: string;
  uploadedBy: string;

  sourceType: SourceType;
  importMode: ImportMode;

  title: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;

  status: SourceDocumentStatus;
  parserVersion: string | null;
  wordCount: number | null;
  sectionCount: number | null;
  errorMessage: string | null;
  processedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface UploadSourceDocumentInput {
  worldId: string;
  file: File;
  title?: string;
  sourceType: SourceType;
  importMode: ImportMode;
}

interface SourceDocumentRow {
  id: string;
  world_id: string;
  uploaded_by: string;

  source_type: SourceType;
  import_mode: ImportMode;

  title: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  checksum: string | null;

  status: SourceDocumentStatus;
  parser_version: string | null;
  word_count: number | null;
  section_count: number | null;
  error_message: string | null;
  processed_at: string | null;

  created_at: string;
  updated_at: string;
}

interface SupportedFileType {
  mimeType: string;
  label: string;
}

const SUPPORTED_FILE_TYPES: Record<string, SupportedFileType> = {
  docx: {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word document",
  },
  txt: {
    mimeType: "text/plain",
    label: "Text document",
  },
  md: {
    mimeType: "text/markdown",
    label: "Markdown document",
  },
};

function mapSourceDocument(row: SourceDocumentRow): SourceDocument {
  return {
    id: row.id,
    worldId: row.world_id,
    uploadedBy: row.uploaded_by,

    sourceType: row.source_type,
    importMode: row.import_mode,

    title: row.title,
    originalFilename: row.original_filename,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    checksum: row.checksum,

    status: row.status,
    parserVersion: row.parser_version,
    wordCount: row.word_count,
    sectionCount: row.section_count,
    errorMessage: row.error_message,
    processedAt: row.processed_at,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return filename.slice(lastDot + 1).toLowerCase();
}

function removeFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");

  if (lastDot === -1) {
    return filename;
  }

  return filename.slice(0, lastDot);
}

function sanitizeFilename(filename: string): string {
  const extension = getFileExtension(filename);
  const basename = removeFileExtension(filename)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const safeBasename = basename || "document";

  return extension
    ? `${safeBasename.slice(0, 100)}.${extension}`
    : safeBasename.slice(0, 100);
}

function getNormalizedMimeType(file: File): string {
  const extension = getFileExtension(file.name);
  const supportedType = SUPPORTED_FILE_TYPES[extension];

  return supportedType?.mimeType ?? file.type;
}

async function createChecksum(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("You must be signed in to upload a document.");
  }

  return user.id;
}

async function markDocumentFailed(
  documentId: string,
  message: string,
): Promise<void> {
  await supabase
    .from("source_documents")
    .update({
      status: "failed",
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);
}

export function validateSourceFile(file: File): void {
  if (!file) {
    throw new Error("Choose a document to upload.");
  }

  if (file.size === 0) {
    throw new Error("The selected document is empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Documents must be smaller than 25 MB.");
  }

  const extension = getFileExtension(file.name);

  if (!SUPPORTED_FILE_TYPES[extension]) {
    throw new Error(
      "Unsupported document type. Upload a DOCX, TXT, or Markdown file.",
    );
  }
}

export function getAcceptedSourceFileTypes(): string {
  return ".docx,.txt,.md";
}

export async function uploadSourceDocument(
  input: UploadSourceDocumentInput,
): Promise<SourceDocument> {
  validateSourceFile(input.file);

  if (!input.worldId.trim()) {
    throw new Error("A world is required before uploading a document.");
  }

  const userId = await getAuthenticatedUserId();
  const checksum = await createChecksum(input.file);

  /*
   * Check for an existing copy before uploading the file.
   * RLS ensures this query only sees documents belonging to this user.
   */
  const { data: existingDocument, error: duplicateCheckError } =
    await supabase
      .from("source_documents")
      .select("*")
      .eq("world_id", input.worldId)
      .eq("checksum", checksum)
      .neq("status", "archived")
      .maybeSingle();

  if (duplicateCheckError) {
    throw new Error(duplicateCheckError.message);
  }

  if (existingDocument) {
    const existing = mapSourceDocument(
      existingDocument as SourceDocumentRow,
    );

    throw new Error(
      `"${existing.title}" has already been uploaded to this world.`,
    );
  }

  const documentId = crypto.randomUUID();
  const safeFilename = sanitizeFilename(input.file.name);

  /*
   * The first folder must be the authenticated user's ID because
   * our Storage RLS policies check that folder.
   */
  const storagePath = [
    userId,
    input.worldId,
    documentId,
    safeFilename,
  ].join("/");

  const title =
    input.title?.trim() ||
    removeFileExtension(input.file.name).trim() ||
    "Untitled document";

  const mimeType = getNormalizedMimeType(input.file);
  const now = new Date().toISOString();

  /*
   * First create the database record as "uploading".
   * That lets us record a useful failure if Storage rejects the file.
   */
  const { data: createdRow, error: createError } = await supabase
    .from("source_documents")
    .insert({
      id: documentId,
      world_id: input.worldId,
      uploaded_by: userId,

      source_type: input.sourceType,
      import_mode: input.importMode,

      title,
      original_filename: input.file.name,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: input.file.size,
      checksum,

      status: "uploading",
      error_message: null,
      updated_at: now,
    })
    .select("*")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      throw new Error(
        "This document has already been uploaded to this world.",
      );
    }

    throw new Error(createError.message);
  }

  const createdDocument = mapSourceDocument(
    createdRow as SourceDocumentRow,
  );

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, input.file, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    await markDocumentFailed(documentId, uploadError.message);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: completedRow, error: completeError } = await supabase
    .from("source_documents")
    .update({
      status: "uploaded",
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("world_id", input.worldId)
    .select("*")
    .single();

  if (completeError) {
    /*
     * Avoid leaving a private file without a usable database record.
     */
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    await markDocumentFailed(documentId, completeError.message);

    throw new Error(
      `The file uploaded, but its record could not be completed: ${completeError.message}`,
    );
  }

  return completedRow
    ? mapSourceDocument(completedRow as SourceDocumentRow)
    : createdDocument;
}

export async function listSourceDocuments(
  worldId: string,
): Promise<SourceDocument[]> {
  const { data, error } = await supabase
    .from("source_documents")
    .select("*")
    .eq("world_id", worldId)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SourceDocumentRow[]).map(
    mapSourceDocument,
  );
}

export async function getSourceDocument(
  worldId: string,
  documentId: string,
): Promise<SourceDocument> {
  const { data, error } = await supabase
    .from("source_documents")
    .select("*")
    .eq("id", documentId)
    .eq("world_id", worldId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSourceDocument(data as SourceDocumentRow);
}

export async function createSourceDocumentDownloadUrl(
  document: SourceDocument,
  expiresInSeconds = 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(document.storagePath, expiresInSeconds);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function deleteSourceDocument(
  document: SourceDocument,
): Promise<void> {
  /*
   * Delete the private file first. If deleting the database row fails,
   * the user can retry without leaving an inaccessible Storage object.
   */
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([document.storagePath]);

  if (storageError) {
    throw new Error(
      `The document could not be removed from storage: ${storageError.message}`,
    );
  }

  const { error: databaseError } = await supabase
    .from("source_documents")
    .delete()
    .eq("id", document.id)
    .eq("world_id", document.worldId);

  if (databaseError) {
    throw new Error(
      `The file was removed, but its record could not be deleted: ${databaseError.message}`,
    );
  }
}