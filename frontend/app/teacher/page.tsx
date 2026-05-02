"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllClassSummaries } from "@/lib/struggles";
import type { ClassStruggleSummary } from "@/lib/struggles";

export default function TeacherDashboard() {
  const [summaries, setSummaries] = useState<ClassStruggleSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    setSummaries(getAllClassSummaries());
  }, []);

  function refresh() {
    setSummaries(getAllClassSummaries());
  }

  const activeSummary = summaries.find((s) => s.classId === selectedClass);

  return (
    <div
      className="min-h-screen bg-[#e9e7e0]"
      style={{ colorScheme: "light" }}
    >
      {/* Header */}
      <header className="border-b border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Open Hours logo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold text-[#2d4a3e]">
              Teacher Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="flex items-center gap-2 rounded-xl border border-[#d4d2cb] bg-white px-4 py-2 text-sm font-medium text-[#2d4a3e] transition-colors hover:bg-zinc-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Refresh
            </button>
            <Link
              href="/classes"
              className="rounded-xl bg-[#2d4a3e] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#1e3a2e]"
            >
              Student View
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2d4a3e]/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2d4a3e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#2d4a3e]">
              No student data yet
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Student struggles will appear here once they start using Open
              Hours. Click Refresh to check for new data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Class list */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#2d4a3e]">Classes</h2>
              {summaries.map((summary) => (
                <button
                  key={summary.classId}
                  onClick={() => setSelectedClass(summary.classId)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                    selectedClass === summary.classId
                      ? "border-[#2d4a3e] bg-white shadow-md"
                      : "border-[#d4d2cb] bg-white/60 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <h3 className="font-semibold text-[#2d4a3e]">
                    {summary.className}
                  </h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
                    <span>{summary.totalQuestions} questions</span>
                    <span>{summary.students.length} student{summary.students.length !== 1 ? "s" : ""}</span>
                  </div>
                  {summary.topTopics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {summary.topTopics.slice(0, 3).map((t) => (
                        <span
                          key={t.topic}
                          className="rounded-full bg-[#2d4a3e]/10 px-2.5 py-0.5 text-xs font-medium text-[#2d4a3e]"
                        >
                          {t.topic} ({t.count})
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Class detail */}
            <div className="lg:col-span-2">
              {activeSummary ? (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-[#2d4a3e]">
                    {activeSummary.className} — Struggle Report
                  </h2>

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
                          const pct = Math.round(
                            (t.count / activeSummary.totalQuestions) * 100
                          );
                          return (
                            <div key={t.topic}>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-zinc-700">
                                  {t.topic}
                                </span>
                                <span className="text-zinc-400">
                                  {t.count} question{t.count !== 1 ? "s" : ""} ({pct}%)
                                </span>
                              </div>
                              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                  className="h-full rounded-full bg-[#2d4a3e]"
                                  style={{ width: `${pct}%` }}
                                />
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
                          <div
                            key={student.name}
                            className="rounded-xl border border-zinc-100 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d4a3e]/10 text-sm font-bold text-[#2d4a3e]">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-zinc-800">
                                    {student.name}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    {student.struggles.length} question{student.struggles.length !== 1 ? "s" : ""}
                                    {" · "}Avg hint level{" "}
                                    {student.avgHintLevel.toFixed(1)}
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

                            {/* Recent struggles */}
                            <ul className="mt-3 space-y-1.5">
                              {student.struggles.slice(0, 5).map((s) => (
                                <li
                                  key={s.id}
                                  className="flex items-start gap-2 text-xs"
                                >
                                  <span className="mt-0.5 shrink-0 rounded bg-[#2d4a3e]/10 px-1.5 py-0.5 font-medium text-[#2d4a3e]">
                                    {s.topic}
                                  </span>
                                  <span className="text-zinc-600 line-clamp-1">
                                    {s.question}
                                  </span>
                                  <span className="ml-auto shrink-0 text-zinc-400">
                                    L{s.hintLevel}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="text-sm text-zinc-400">
                    Select a class to view the struggle report.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
