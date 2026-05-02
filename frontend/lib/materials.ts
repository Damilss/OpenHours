/**
 * Course materials storage.
 *
 * Teachers upload files per class. The metadata is stored in localStorage.
 * In a real app, files would be uploaded to a server/S3 and indexed for
 * RAG-based retrieval. For now we store the file name, type, size, and
 * a data URL so the AI can reference what materials exist.
 */

export interface CourseMaterial {
  id: string;
  classId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: number;
  /** Base64 data URL for small files, or empty for large ones */
  dataUrl: string;
}

const STORAGE_KEY = "open-hours-materials";

export function getAllMaterials(): CourseMaterial[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getMaterialsForClass(classId: string): CourseMaterial[] {
  return getAllMaterials().filter((m) => m.classId === classId);
}

export function addMaterial(material: CourseMaterial): void {
  const all = getAllMaterials();
  all.push(material);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeMaterial(id: string): void {
  const all = getAllMaterials().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get a friendly icon name based on file type */
export function getFileIcon(fileType: string): "pdf" | "slides" | "doc" | "image" | "other" {
  if (fileType === "application/pdf") return "pdf";
  if (
    fileType.includes("presentation") ||
    fileType.includes("powerpoint") ||
    fileType.includes("slide")
  )
    return "slides";
  if (
    fileType.includes("document") ||
    fileType.includes("word") ||
    fileType.includes("text")
  )
    return "doc";
  if (fileType.startsWith("image/")) return "image";
  return "other";
}
