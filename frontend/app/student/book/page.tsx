"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Course {
  id: string;
  name: string;
}

export default function BookPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "professor") {
        router.push("/professor");
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name")
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);
      if (courseData && courseData.length > 0) {
        setSelectedCourseId(courseData[0].id);
      }
    }
    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourseId) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      student_id: user.id,
      course_id: selectedCourseId,
      message: message.trim() || null,
      status: "pending",
    });

    if (insertError) {
      setError("Failed to submit request. Please try again.");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 max-w-sm w-full text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">
            Request sent!
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Your professor has been notified. They&apos;ll confirm a time with
            you soon.
          </p>
          <Link
            href="/student"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 px-6 py-3 flex items-center gap-4">
        <Link
          href="/student"
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/openhoursNOTEXT.png" alt="OpenHours" width={48} height={48} className="mt-2" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Book office hours
            </h1>
            <p className="text-sm text-zinc-500">
              Request a session with your professor
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Course
              </label>
              {courses.length === 0 ? (
                <p className="text-sm text-zinc-400">No courses available.</p>
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                What do you need help with?{" "}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe what you're stuck on so your professor can prepare…"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedCourseId}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending request…" : "Send request"}
            </button>
          </form>
        </div>

        <p className="text-xs text-zinc-400 text-center mt-4">
          Your professor will confirm a time via email or in-person.
        </p>
      </main>
    </div>
  );
}
