"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Upload,
  BarChart3,
  LogOut,
  Users,
  FileText,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Course {
  id: string;
  name: string;
  description: string;
  created_at: string;
  join_code: string;
}

export default function ProfessorDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

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
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "student") {
        router.push("/student");
        return;
      }

      setUserName(profile?.full_name ?? "Professor");

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, description, created_at, join_code")
        .eq("professor_id", user.id)
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);

      if (courseData && courseData.length > 0) {
        const courseIds = courseData.map((c) => c.id);

        const { count } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds);

        setDocCount(count ?? 0);

      }

      setLoading(false);
    }
    init();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/openhoursNOTEXT.png" alt="OpenHours" width={48} height={48} className="mt-2" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{userName}</span>
          <button
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back, {userName.split(" ")[0]}
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your courses and track student progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            {
              label: "Courses",
              value: courses.length,
              icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
            },
            {
              label: "Document chunks",
              value: docCount,
              icon: <FileText className="w-5 h-5 text-emerald-500" />,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/professor/upload"
            className="bg-indigo-600 text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-indigo-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Upload materials</p>
              <p className="text-sm text-indigo-200">
                Add PDFs, slides, or videos
              </p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-indigo-300" />
          </Link>
          <Link
            href="/professor/analytics"
            className="bg-white border border-zinc-100 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-200 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-zinc-800">View analytics</p>
              <p className="text-sm text-zinc-400">
                See what students struggle with
              </p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-zinc-300" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-800">Your courses</h2>
              <Link
                href="/professor/upload"
                className="text-xs text-indigo-600 hover:underline"
              >
                + New course
              </Link>
            </div>
            {courses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No courses yet</p>
                <Link
                  href="/professor/upload"
                  className="text-sm text-indigo-600 hover:underline mt-1 inline-block"
                >
                  Create your first course
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-800">
                        {c.name}
                      </p>
                      {c.description && (
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                          {c.description}
                        </p>
                      )}
                      {c.join_code && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                            {c.join_code}
                          </span>
                          <button
                            onClick={() => copyCode(c.join_code)}
                            className="text-zinc-400 hover:text-indigo-600 transition-colors"
                            aria-label="Copy join code"
                          >
                            {copiedCode === c.join_code
                              ? <Check className="w-3 h-3 text-emerald-500" />
                              : <Copy className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/professor/upload?course=${c.id}`}
                      className="text-xs text-indigo-600 hover:underline shrink-0 ml-2"
                    >
                      Upload
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
      </main>
    </div>
  );
}
