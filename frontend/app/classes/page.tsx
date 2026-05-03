"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { clearSession } from "@/lib/users";

interface ClassItem {
  id: string;
  name: string;
  instructor: string;
  section: string;
  color: string;
}

const SAMPLE_CLASSES: ClassItem[] = [
  {
    id: "1",
    name: "CSC 101 — Fundamentals of CS",
    instructor: "Dr. Smith",
    section: "Section 01",
    color: "#2d4a3e",
  },
  {
    id: "2",
    name: "MATH 141 — Calculus I",
    instructor: "Prof. Johnson",
    section: "Section 03",
    color: "#4a6741",
  },
  {
    id: "3",
    name: "PHYS 141 — General Physics I",
    instructor: "Dr. Lee",
    section: "Section 02",
    color: "#5c7a4e",
  },
];

export default function ClassesPage() {
  return (
    <Suspense>
      <ClassesContent />
    </Suspense>
  );
}

function ClassesContent() {
  const searchParams = useSearchParams();
  const isTeacherPreview = searchParams.get("role") === "teacher";

  const [classes, setClasses] = useState<ClassItem[]>(SAMPLE_CLASSES);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showContinue, setShowContinue] = useState(false);

  function handleSubmitCode() {
    if (joinCode.trim()) {
      setShowContinue(true);
    }
  }

  function handleJoinClass() {
    const newClass: ClassItem = {
      id: String(classes.length + 1),
      name: `New Class — ${joinCode.toUpperCase()}`,
      instructor: "Instructor TBD",
      section: "Section 01",
      color: "#6b8f5e",
    };
    setClasses([...classes, newClass]);
    setJoinCode("");
    setShowContinue(false);
    setShowJoinModal(false);
  }

  return (
    <div
      className="min-h-screen bg-[#e9e7e0] relative"
      style={{ colorScheme: "light" }}
    >
      {/* Teacher preview border overlay */}
      {isTeacherPreview && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5 animate-border-flow bg-gradient-to-r from-[#2d4a3e] via-[#9b72cf] to-[#2d4a3e]" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-1.5 animate-border-flow bg-gradient-to-r from-[#9b72cf] via-[#2d4a3e] to-[#9b72cf]" />
          <div className="pointer-events-none fixed inset-y-0 left-0 z-50 w-1.5 animate-border-flow bg-gradient-to-b from-[#2d4a3e] via-[#9b72cf] to-[#2d4a3e]" />
          <div className="pointer-events-none fixed inset-y-0 right-0 z-50 w-1.5 animate-border-flow bg-gradient-to-b from-[#9b72cf] via-[#2d4a3e] to-[#9b72cf]" />
        </>
      )}
      {/* Teacher preview banner */}
      {isTeacherPreview && (
        <div className="bg-gradient-to-r from-[#2d4a3e]/10 via-[#d4c5d8]/30 to-[#2d4a3e]/10 px-6 py-2">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <p className="text-xs font-medium text-[#2d4a3e]/70">
              👁 You are viewing as a student
            </p>
            <Link
              href="/teacher"
              className="text-xs font-semibold text-[#2d4a3e] hover:underline"
            >
              ← Back to Teacher Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-[#2d4a3e]">
              Open Hours
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => clearSession()}
              className="rounded-xl border border-[#d4d2cb] bg-white px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
            >
              Sign Out
            </Link>
            <button
              onClick={() => setShowJoinModal(true)}
              disabled={isTeacherPreview}
              className="flex items-center gap-2 rounded-xl bg-[#2d4a3e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Join Class
            </button>
          </div>
        </div>
      </header>

      {/* Class grid */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-[#2d4a3e]">My Classes</h1>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/chat/${cls.id}${isTeacherPreview ? "?role=teacher" : ""}`}
              className="group overflow-hidden rounded-2xl border border-[#d4d2cb] bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="h-24 p-5" style={{ backgroundColor: cls.color }}>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {cls.name}
                </h2>
                <p className="mt-1 text-sm text-white/80">{cls.instructor}</p>
              </div>
              <div className="flex items-center justify-between p-5">
                <span className="text-sm text-zinc-500">{cls.section}</span>
                <span className="text-xs font-medium text-[#2d4a3e] opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-[#2d4a3e]">Join a Class</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Enter the class code provided by your instructor.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="join-code" className="block text-sm font-medium text-zinc-700">
                  Class Code
                </label>
                <input
                  id="join-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setShowContinue(false); }}
                  placeholder="e.g. ABC-1234"
                  className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
                />
              </div>
              {!showContinue ? (
                <button onClick={handleSubmitCode} disabled={!joinCode.trim()} className="w-full rounded-xl bg-[#2d4a3e] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500">
                  Submit Code
                </button>
              ) : (
                <button onClick={handleJoinClass} className="w-full rounded-xl bg-[#4a7c59] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#3d6b4a]">
                  Continue →
                </button>
              )}
              <button onClick={() => { setShowJoinModal(false); setJoinCode(""); setShowContinue(false); }} className="w-full rounded-xl border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom-left logo */}
      <div className="fixed bottom-4 left-4 z-40">
        <Image src="/logo.jpg" alt="Open Hours logo" width={72} height={72} className="rounded-xl opacity-80 shadow-lg" />
      </div>
    </div>
  );
}
