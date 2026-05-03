"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Course {
  id: string;
  name: string;
}

interface UploadStatus {
  file: string;
  status: "uploading" | "done" | "error";
  message?: string;
}

interface PastFile {
  source_file: string;
  count: number;
  created_at: string;
}

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams.get("course") ?? ""
  );
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [dragging, setDragging] = useState(false);
  const [userId, setUserId] = useState("");
  const [pastFiles, setPastFiles] = useState<PastFile[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "student") { router.push("/student"); return; }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name")
        .eq("professor_id", user.id)
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);
      const courseId = searchParams.get("course") ?? courseData?.[0]?.id ?? "";
      if (courseId) {
        setSelectedCourseId(courseId);
        await loadPastFiles(courseId);
      }
    }
    init();
  }, [router]);

  async function loadPastFiles(courseId: string) {
    if (!courseId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("documents")
      .select("source_file, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (!data) { setPastFiles([]); return; }

    // Group by source_file and count chunks
    const grouped: Record<string, PastFile> = {};
    for (const row of data) {
      if (!row.source_file) continue;
      if (!grouped[row.source_file]) {
        grouped[row.source_file] = { source_file: row.source_file, count: 0, created_at: row.created_at };
      }
      grouped[row.source_file].count++;
    }
    setPastFiles(Object.values(grouped));
  }

  async function deleteFile(sourceFile: string) {
    if (!selectedCourseId) return;
    setDeletingFile(sourceFile);
    const supabase = createClient();
    await supabase
      .from("documents")
      .delete()
      .eq("course_id", selectedCourseId)
      .eq("source_file", sourceFile);
    await loadPastFiles(selectedCourseId);
    setDeletingFile(null);
  }

  async function createCourse() {
    if (!newCourseName.trim()) return;
    setCreatingCourse(true);
    const supabase = createClient();

    // Always fetch the current user directly to avoid stale userId state
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreatingCourse(false);
      return;
    }

    const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        professor_id: user.id,
        name: newCourseName.trim(),
        description: newCourseDesc.trim() || null,
        join_code,
      })
      .select("id, name")
      .single();

    if (error) {
      console.error("Failed to create course:", error.message, error.details, error.hint);
      alert(`Failed to create course: ${error.message}`);
    } else if (data) {
      setCourses((prev) => [data, ...prev]);
      setSelectedCourseId(data.id);
      setNewCourseName("");
      setNewCourseDesc("");
      setShowNewCourse(false);
      setPastFiles([]);
    } else {
      console.error("Create course error:", error);
    }
    setCreatingCourse(false);
  }

  async function uploadFile(file: File) {
    if (!selectedCourseId) return;

    const status: UploadStatus = { file: file.name, status: "uploading" };
    setUploads((prev) => [...prev, status]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course_id", selectedCourseId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setUploads((prev) =>
        prev.map((u) =>
          u.file === file.name
            ? {
                ...u,
                status: res.ok ? "done" : "error",
                message: res.ok
                  ? `${data.chunks} chunks indexed`
                  : data.error ?? "Upload failed",
              }
            : u
        )
      );

      if (res.ok) await loadPastFiles(selectedCourseId);
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.file === file.name
            ? { ...u, status: "error", message: "Network error" }
            : u
        )
      );
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 px-6 py-3 flex items-center gap-4">
        <Link href="/professor" className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/openhoursNOTEXT.png" alt="OpenHours" width={48} height={48} className="mt-2" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Upload course materials</h1>
        <p className="text-zinc-500 mb-8">PDFs, PowerPoint slides, and video files are supported.</p>

        {/* Course selector */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-zinc-700">Select course</label>
            <button
              onClick={() => setShowNewCourse((v) => !v)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
            >
              <Plus className="w-3 h-3" />
              New course
            </button>
          </div>

          {showNewCourse && (
            <div className="mb-4 p-4 bg-indigo-50 rounded-xl flex flex-col gap-3">
              <input
                type="text"
                placeholder="Course name (e.g. CS 101)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                onClick={createCourse}
                disabled={creatingCourse || !newCourseName.trim()}
                className="self-end bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {creatingCourse ? "Creating…" : "Create course"}
              </button>
            </div>
          )}

          {courses.length === 0 ? (
            <p className="text-sm text-zinc-400">No courses yet — create one above.</p>
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); loadPastFiles(e.target.value); }}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-zinc-200 hover:border-zinc-300"
          } ${!selectedCourseId ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Upload className="w-8 h-8 text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-600">Drop files here or click to browse</p>
          <p className="text-xs text-zinc-400 mt-1">PDF, PPTX, MP4, MOV, MP3 supported</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.pptx,.ppt,.mp4,.mov,.mp3,.wav"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Upload statuses */}
        {uploads.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            {uploads.map((u, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
                {u.status === "uploading" ? (
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                ) : u.status === "done" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-zinc-700 truncate">{u.file}</p>
                  {u.message && (
                    <p className={`text-xs mt-0.5 ${u.status === "error" ? "text-red-500" : "text-zinc-400"}`}>
                      {u.message}
                    </p>
                  )}
                </div>
                <FileText className="w-4 h-4 text-zinc-200 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Past uploads */}
        {pastFiles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-zinc-700 mb-3">Previously uploaded</h2>
            <div className="flex flex-col gap-2">
              {pastFiles.map((f) => (
                <div key={f.source_file} className="bg-white rounded-xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-700 truncate">{f.source_file}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{f.count} chunks · uploaded {formatDate(f.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteFile(f.source_file)}
                    disabled={deletingFile === f.source_file}
                    className="text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                    aria-label="Delete file"
                  >
                    {deletingFile === f.source_file
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done button */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/professor"
            className="bg-indigo-600 text-white text-sm px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Done
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadForm />
    </Suspense>
  );
}
