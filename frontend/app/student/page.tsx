"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Send,
  CalendarClock,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
}

export default function StudentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      if (profile?.role === "professor") {
        router.push("/professor");
        return;
      }

      setUserName(profile?.full_name ?? "Student");

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, description")
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);
      if (courseData && courseData.length > 0) {
        setSelectedCourse(courseData[0]);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  async function sendMessage() {
    if (!input.trim() || !selectedCourse) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          course_id: selectedCourse.id,
          history: messages,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer ?? "Sorry, I couldn't get a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>

        {/* Course selector */}
        <div className="relative">
          <button
            onClick={() => setCourseOpen((o) => !o)}
            className="flex items-center gap-2 text-sm border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
          >
            <span className="text-zinc-700">
              {selectedCourse?.name ?? "Select a course"}
            </span>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>
          {courseOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 min-w-48">
              {courses.length === 0 ? (
                <p className="text-sm text-zinc-400 px-4 py-3">
                  No courses available
                </p>
              ) : (
                courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCourse(c);
                      setCourseOpen(false);
                      setMessages([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{userName}</span>
          <Link
            href="/student/book"
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            <CalendarClock className="w-4 h-4" />
            Book office hours
          </Link>
          <button
            onClick={handleSignOut}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-zinc-50">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="font-semibold text-zinc-800 mb-2">
                {selectedCourse
                  ? `Ask about ${selectedCourse.name}`
                  : "Select a course to get started"}
              </h2>
              <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                I&apos;ll answer based strictly on your course materials.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-100 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={
              selectedCourse
                ? `Ask about ${selectedCourse.name}…`
                : "Select a course first"
            }
            disabled={!selectedCourse}
            className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !selectedCourse || loading}
            className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
