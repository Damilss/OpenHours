"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, type JSX } from "react";
import { getAllClassSummaries } from "@/lib/struggles";
import type { ClassStruggleSummary } from "@/lib/struggles";
import {
  getMaterialsForClass,
  addMaterial,
  removeMaterial,
  formatFileSize,
  getFileIcon,
} from "@/lib/materials";
import type { CourseMaterial } from "@/lib/materials";
import { clearSession } from "@/lib/users";

const ALL_CLASSES = [
  { id: "1", name: "CSC 101 — Fundamentals of CS" },
  { id: "2", name: "MATH 141 — Calculus I" },
  { id: "3", name: "PHYS 141 — General Physics I" },
];

const FILE_ICONS: Record<string, JSX.Element> = {
  pdf: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  slides: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h6" />
    </svg>
  ),
  doc: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  other: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default function TeacherDashboard() {
  const [summaries, setSummaries] = useState<ClassStruggleSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSummaries(getAllClassSummaries());
  }, []);

  useEffect(() => {
    if (selectedClass) {
      setMaterials(getMaterialsForClass(selectedClass));
    }
  }, [selectedClass]);

  function refresh() {
    setSummaries(getAllClassSummaries());
    if (selectedClass) {
      setMaterials(getMaterialsForClass(selectedClass));
    }
  }

  const handleFiles = useCallback(
    (files: FileList) => {
      if (!selectedClass) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const mat: CourseMaterial = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            classId: selectedClass,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: Date.now(),
            dataUrl: file.size < 5 * 1024 * 1024 ? (reader.result as string) : "",
          };
          addMaterial(mat);
          setMaterials((prev) => [...prev, mat]);
        };
        reader.readAsDataURL(file);
      });
    },
    [selectedClass]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleRemoveMaterial(id: string) {
    removeMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  const activeSummary = summaries.find((s) => s.classId === selectedClass);
  const activeClassName =
    ALL_CLASSES.find((c) => c.id === selectedClass)?.name ?? "";

  return (
    <div className="min-h-screen bg-[#e9e7e0]" style={{ colorScheme: "light" }}>
      {/* Header */}
      <header className="border-b border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-[#2d4a3e]">Teacher Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("open-hours-struggles");
                  localStorage.removeItem("open-hours-materials");
                  setSummaries([]);
                  setMaterials([]);
                  setSelectedClass(null);
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              Clear Data
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-2 rounded-xl border border-[#d4d2cb] bg-white px-4 py-2 text-sm font-medium text-[#2d4a3e] transition-colors hover:bg-zinc-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Refresh
            </button>
            <Link href="/classes?role=teacher" className="rounded-xl bg-[#2d4a3e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e3a2e]">
              Student View
            </Link>
            <Link href="/login" onClick={() => clearSession()} className="rounded-xl border border-[#d4d2cb] bg-white px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50">
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Class list — always show all classes */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#2d4a3e]">Classes</h2>
            {ALL_CLASSES.map((cls) => {
              const summary = summaries.find((s) => s.classId === cls.id);
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                    selectedClass === cls.id
                      ? "border-[#2d4a3e] bg-white shadow-md"
                      : "border-[#d4d2cb] bg-white/60 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <h3 className="font-semibold text-[#2d4a3e]">{cls.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
                    <span>{summary?.totalQuestions ?? 0} questions</span>
                    <span>{summary?.students.length ?? 0} student{(summary?.students.length ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                  {summary && summary.topTopics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {summary.topTopics.slice(0, 3).map((t) => (
                        <span key={t.topic} className="rounded-full bg-[#2d4a3e]/10 px-2.5 py-0.5 text-xs font-medium text-[#2d4a3e]">
                          {t.topic} ({t.count})
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Class detail */}
          <div className="lg:col-span-2">
            {selectedClass ? (
              <div key={selectedClass} className="space-y-6 animate-content-in">
                <h2 className="text-lg font-bold text-[#2d4a3e]">{activeClassName}</h2>

                {/* Course Materials Upload */}
                <div className="rounded-2xl border border-[#d4d2cb] bg-white p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Course Materials
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Upload slides, PDFs, notes, and other materials. The AI will use these to better support students.
                  </p>

                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
                      isDragging
                        ? "border-[#2d4a3e] bg-[#2d4a3e]/5"
                        : "border-zinc-300 hover:border-[#2d4a3e]/50 hover:bg-zinc-50"
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload course materials"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragging ? "#2d4a3e" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <p className="mt-3 text-sm font-medium text-zinc-600">
                      {isDragging ? "Drop files here" : "Drag & drop files here"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      or click to browse — PDF, PPTX, DOCX, images, and more
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.gif,.csv,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />

                  {/* Uploaded files list */}
                  {materials.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {materials
                        .sort((a, b) => b.uploadedAt - a.uploadedAt)
                        .map((mat) => (
                          <li
                            key={mat.id}
                            className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                          >
                            {FILE_ICONS[getFileIcon(mat.fileType)]}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-800">
                                {mat.fileName}
                              </p>
                              <p className="text-xs text-zinc-400">
                                {formatFileSize(mat.fileSize)} ·{" "}
                                {new Date(mat.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveMaterial(mat.id)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              aria-label={`Remove ${mat.fileName}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                {/* Struggle Report */}
                {activeSummary && (
                  <>
                    {/* Top struggling topics */}
                    <div className="rounded-2xl border border-[#d4d2cb] bg-white p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        Top Struggling Topics
                      </h3>
                      {activeSummary.topTopics.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No data yet.</p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {activeSummary.topTopics.map((t) => {
                            const pct = Math.round((t.count / activeSummary.totalQuestions) * 100);
                            return (
                              <div key={t.topic}>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-zinc-700">{t.topic}</span>
                                  <span className="text-zinc-400">
                                    {t.count} question{t.count !== 1 ? "s" : ""} ({pct}%)
                                  </span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                                  <div className="h-full rounded-full bg-[#2d4a3e]" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Per-student breakdown */}
                    <div className="rounded-2xl border border-[#d4d2cb] bg-white p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        Student Breakdown
                      </h3>
                      {activeSummary.students.length === 0 ? (
                        <p className="mt-3 text-sm text-zinc-500">No students yet.</p>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {activeSummary.students.map((student) => (
                            <div key={student.name} className="rounded-xl border border-zinc-100 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d4a3e]/10 text-sm font-bold text-[#2d4a3e]">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-zinc-800">{student.name}</p>
                                    <p className="text-xs text-zinc-400">
                                      {student.struggles.length} question{student.struggles.length !== 1 ? "s" : ""}
                                      {" · "}Avg hint level {student.avgHintLevel.toFixed(1)}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    student.avgHintLevel >= 2.5
                                      ? "bg-red-100 text-red-700"
                                      : student.avgHintLevel >= 1.5
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {student.avgHintLevel >= 2.5
                                    ? "Needs Help"
                                    : student.avgHintLevel >= 1.5
                                      ? "Working Through It"
                                      : "On Track"}
                                </span>
                              </div>
                              <ul className="mt-3 space-y-1.5">
                                {student.struggles.slice(0, 5).map((s) => (
                                  <li key={s.id} className="flex items-start gap-2 text-xs">
                                    <span className="mt-0.5 shrink-0 rounded bg-[#2d4a3e]/10 px-1.5 py-0.5 font-medium text-[#2d4a3e]">
                                      {s.topic}
                                    </span>
                                    <span className="text-zinc-600 line-clamp-1">{s.question}</span>
                                    <span className="ml-auto shrink-0 text-zinc-400">L{s.hintLevel}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!activeSummary && (
                  <div className="rounded-2xl border border-[#d4d2cb] bg-white p-6 text-center">
                    <p className="text-sm text-zinc-400">
                      No student struggles recorded yet for this class. Upload materials above so the AI is ready when students start asking questions.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Overview summary of all classes — paragraph form */
              <div key="overview" className="space-y-6 animate-content-in">
                <h2 className="text-lg font-bold text-[#2d4a3e]">
                  Student Struggle Summary
                </h2>

                <div className="rounded-2xl border border-[#d4d2cb] bg-white p-6">
                  {summaries.length === 0 ? (
                    <p className="text-sm leading-relaxed text-zinc-500">
                      No student data has been recorded yet. Once students begin
                      using Open Hours, a written summary of their struggles
                      across all classes will appear here.
                    </p>
                  ) : (
                    <div className="space-y-6 text-sm leading-relaxed text-zinc-700">
                      {summaries.map((summary) => {
                        const needsHelp = summary.students.filter(
                          (s) => s.avgHintLevel >= 2.5
                        );
                        const workingThrough = summary.students.filter(
                          (s) => s.avgHintLevel >= 1.5 && s.avgHintLevel < 2.5
                        );
                        const onTrack = summary.students.filter(
                          (s) => s.avgHintLevel < 1.5
                        );

                        return (
                          <div key={summary.classId}>
                            <h3 className="mb-2 text-base font-bold text-[#2d4a3e]">
                              {summary.className}
                            </h3>

                            <p>
                              Across {summary.totalQuestions} question
                              {summary.totalQuestions !== 1 ? "s" : ""} from{" "}
                              {summary.students.length} student
                              {summary.students.length !== 1 ? "s" : ""}
                              {summary.topTopics.length > 0 && (
                                <>
                                  , the most common areas of difficulty are{" "}
                                  {summary.topTopics.map((t, i) => (
                                    <span key={t.topic}>
                                      {i > 0 &&
                                        i < summary.topTopics.length - 1 &&
                                        ", "}
                                      {i > 0 &&
                                        i === summary.topTopics.length - 1 &&
                                        " and "}
                                      <span className="font-semibold text-[#2d4a3e]">
                                        {t.topic}
                                      </span>
                                      {" "}({t.count})
                                    </span>
                                  ))}
                                </>
                              )}
                              .
                            </p>

                            {needsHelp.length > 0 && (
                              <p className="mt-2">
                                <span className="font-semibold text-red-700">
                                  {needsHelp.map((s) => s.name).join(", ")}
                                </span>{" "}
                                {needsHelp.length === 1 ? "is" : "are"}{" "}
                                consistently needing level 3 hints, which
                                suggests they may need direct intervention or
                                additional office hours time on these topics.
                              </p>
                            )}

                            {workingThrough.length > 0 && (
                              <p className="mt-2">
                                {workingThrough.map((s) => s.name).join(", ")}{" "}
                                {workingThrough.length === 1 ? "is" : "are"}{" "}
                                making progress but still requiring guided
                                questions (level 2 hints) to work through
                                problems.
                              </p>
                            )}

                            {onTrack.length > 0 && (
                              <p className="mt-2">
                                {onTrack.map((s) => s.name).join(", ")}{" "}
                                {onTrack.length === 1 ? "appears" : "appear"} to
                                be on track, typically only needing a small
                                conceptual nudge to move forward.
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {ALL_CLASSES.filter(
                        (cls) => !summaries.find((s) => s.classId === cls.id)
                      ).length > 0 && (
                        <div>
                          <h3 className="mb-2 text-base font-bold text-zinc-400">
                            No Activity Yet
                          </h3>
                          <p className="text-zinc-400">
                            {ALL_CLASSES.filter(
                              (cls) =>
                                !summaries.find((s) => s.classId === cls.id)
                            )
                              .map((cls) => cls.name)
                              .join(", ")}{" "}
                            — no students have asked questions in{" "}
                            {ALL_CLASSES.filter(
                              (cls) =>
                                !summaries.find((s) => s.classId === cls.id)
                            ).length === 1
                              ? "this class"
                              : "these classes"}{" "}
                            yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Fixed bottom-left logo */}
      <div className="fixed bottom-4 left-4 z-40">
        <Image
          src="/logo.jpg"
          alt="Open Hours logo"
          width={72}
          height={72}
          className="rounded-xl opacity-80 shadow-lg"
        />
      </div>
    </div>
  );
}
