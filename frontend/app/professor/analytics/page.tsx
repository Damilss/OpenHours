"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Course {
  id: string;
  name: string;
}

interface TopicStat {
  topic: string;
  count: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);

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

      if (profile?.role === "student") {
        router.push("/student");
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name")
        .eq("professor_id", user.id)
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);
      if (courseData && courseData.length > 0) {
        setSelectedCourseId(courseData[0].id);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!selectedCourseId) return;
    fetchAnalytics(selectedCourseId);
  }, [selectedCourseId]);

  async function fetchAnalytics(courseId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?course_id=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics ?? []);
        setTotalQuestions(data.total_questions ?? 0);
      }
    } catch {
      // silently fail — analytics are non-critical
    } finally {
      setLoading(false);
    }
  }

  const maxCount = Math.max(...topics.map((t) => t.count), 1);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-100 px-6 py-3 flex items-center gap-4">
        <Link
          href="/professor"
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Image src="/openhoursNOTEXT.png" alt="OpenHours" width={48} height={48} className="mt-2" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Analytics</h1>
            <p className="text-zinc-500 mt-1">
              See what your students are asking about most.
            </p>
          </div>
          {courses.length > 1 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            {
              label: "Total questions",
              value: totalQuestions,
              icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,
            },
            {
              label: "Topics identified",
              value: topics.length,
              icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
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

        {/* Top topics */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <h2 className="font-semibold text-zinc-800 mb-4">
            Most asked topics
          </h2>
          {loading ? (
            <div className="flex gap-1 py-8 justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">
                No data yet — students haven&apos;t asked questions.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topics.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-zinc-700 truncate">
                        {t.topic}
                      </p>
                      <span className="text-xs text-zinc-400 ml-2 shrink-0">
                        {t.count} {t.count === 1 ? "question" : "questions"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${(t.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
