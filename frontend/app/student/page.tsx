"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Send,
  CalendarClock,
  LogOut,
  ChevronDown,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Pencil,
  Pin,
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

interface ChatSession {
  id: string;
  title: string;
  course_id: string;
  updated_at: string;
  pinned: boolean;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "professor") { router.push("/professor"); return; }

      setUserName(profile?.full_name ?? "Student");
      setUserId(user.id);

      const { data: courseData } = await supabase
        .from("courses")
        .select("id, name, description")
        .order("created_at", { ascending: false });

      setCourses(courseData ?? []);
      if (courseData && courseData.length > 0) {
        setSelectedCourse(courseData[0]);
        await loadSessions(user.id, courseData[0].id, true);
      }
    }
    init();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadSessions(uid: string, courseId: string, keepMessages = false) {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, title, course_id, updated_at, pinned")
      .eq("student_id", uid)
      .eq("course_id", courseId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    setSessions(data ?? []);
    if (!keepMessages) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }

  async function loadSession(sessionId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setActiveSessionId(sessionId);
  }

  async function startNewChat() {
    setMessages([]);
    setActiveSessionId(null);
    inputRef.current?.focus();
  }

  async function deleteSession(sessionId: string) {
    const supabase = createClient();
    await supabase.from("chat_sessions").delete().eq("id", sessionId);
    if (activeSessionId === sessionId) {
      setMessages([]);
      setActiveSessionId(null);
    }
    if (userId && selectedCourse) {
      await loadSessions(userId, selectedCourse.id, true);
    }
    setMenuOpenId(null);
  }

  async function renameSession(sessionId: string) {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    const supabase = createClient();
    await supabase
      .from("chat_sessions")
      .update({ title: renameValue.trim() })
      .eq("id", sessionId);
    setRenamingId(null);
    if (userId && selectedCourse) {
      await loadSessions(userId, selectedCourse.id, true);
    }
  }

  async function togglePin(sessionId: string, currentlyPinned: boolean) {
    const supabase = createClient();
    await supabase
      .from("chat_sessions")
      .update({ pinned: !currentlyPinned })
      .eq("id", sessionId);
    if (userId && selectedCourse) {
      await loadSessions(userId, selectedCourse.id, true);
    }
    setMenuOpenId(null);
  }

  async function sendMessage() {
    if (!input.trim() || !selectedCourse || !userId) return;

    const question = input;
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const supabase = createClient();
        const title = question.length > 50 ? question.slice(0, 50) + "…" : question;
        const { data: newSession } = await supabase
          .from("chat_sessions")
          .insert({ student_id: userId, course_id: selectedCourse.id, title })
          .select("id")
          .single();
        sessionId = newSession?.id ?? null;
        setActiveSessionId(sessionId);
      }

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, course_id: selectedCourse.id, history: messages }),
      });

      const data = await res.json();
      const answer = data.answer ?? "Sorry, I couldn't get a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

      if (sessionId) {
        const supabase = createClient();
        await supabase.from("chat_messages").insert([
          { session_id: sessionId, role: "user", content: question },
          { session_id: sessionId, role: "assistant", content: answer },
        ]);
        await supabase
          .from("chat_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", sessionId);
        await loadSessions(userId, selectedCourse.id, true);
        setActiveSessionId(sessionId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
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

  async function handleCourseSelect(course: Course) {
    setSelectedCourse(course);
    setCourseOpen(false);
    setMessages([]);
    setActiveSessionId(null);
    if (userId) await loadSessions(userId, course.id, true);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  }

  const pinnedSessions = sessions.filter((s) => s.pinned);
  const unpinnedSessions = sessions.filter((s) => !s.pinned);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 bg-white z-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-sm">OpenHours</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setCourseOpen((o) => !o)}
            className="flex items-center gap-2 text-sm border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
          >
            <span className="text-zinc-700">{selectedCourse?.name ?? "Select a course"}</span>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          </button>
          {courseOpen && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 min-w-48">
              {courses.length === 0 ? (
                <p className="text-sm text-zinc-400 px-4 py-3">No courses available</p>
              ) : (
                courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCourseSelect(c)}
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
          <button onClick={handleSignOut} className="text-zinc-400 hover:text-zinc-600 transition-colors" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-100 bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-zinc-100">
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 text-sm bg-indigo-600 text-white rounded-lg px-3 py-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2" ref={menuRef}>
            {sessions.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center mt-6 px-4">
                No past chats yet. Ask a question to get started.
              </p>
            ) : (
              <>
                {pinnedSessions.length > 0 && (
                  <div className="mb-1">
                    <p className="text-xs text-zinc-400 font-medium px-3 py-1">Pinned</p>
                    {pinnedSessions.map((s) => (
                      <SessionItem
                        key={s.id}
                        session={s}
                        isActive={activeSessionId === s.id}
                        menuOpenId={menuOpenId}
                        renamingId={renamingId}
                        renameValue={renameValue}
                        renameRef={renameRef}
                        onLoad={loadSession}
                        onMenuToggle={(id) => setMenuOpenId(menuOpenId === id ? null : id)}
                        onRenameStart={(s) => { setRenamingId(s.id); setRenameValue(s.title); setMenuOpenId(null); }}
                        onRenameChange={setRenameValue}
                        onRenameSubmit={renameSession}
                        onDelete={deleteSession}
                        onTogglePin={togglePin}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
                {unpinnedSessions.length > 0 && (
                  <div>
                    {pinnedSessions.length > 0 && (
                      <p className="text-xs text-zinc-400 font-medium px-3 py-1">Recent</p>
                    )}
                    {unpinnedSessions.map((s) => (
                      <SessionItem
                        key={s.id}
                        session={s}
                        isActive={activeSessionId === s.id}
                        menuOpenId={menuOpenId}
                        renamingId={renamingId}
                        renameValue={renameValue}
                        renameRef={renameRef}
                        onLoad={loadSession}
                        onMenuToggle={(id) => setMenuOpenId(menuOpenId === id ? null : id)}
                        onRenameStart={(s) => { setRenamingId(s.id); setRenameValue(s.title); setMenuOpenId(null); }}
                        onRenameChange={setRenameValue}
                        onRenameSubmit={renameSession}
                        onDelete={deleteSession}
                        onTogglePin={togglePin}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main chat */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-zinc-50">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-zinc-800 mb-2">
                    {selectedCourse ? `Ask about ${selectedCourse.name}` : "Select a course to get started"}
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                    I&apos;ll answer based strictly on your course materials.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t border-zinc-100 bg-white px-4 py-4">
            <div className="max-w-2xl mx-auto flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !loading && sendMessage()}
                placeholder={selectedCourse ? `Ask about ${selectedCourse.name}…` : "Select a course first"}
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
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  menuOpenId: string | null;
  renamingId: string | null;
  renameValue: string;
  renameRef: React.RefObject<HTMLInputElement | null>;
  onLoad: (id: string) => void;
  onMenuToggle: (id: string) => void;
  onRenameStart: (s: ChatSession) => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  formatDate: (iso: string) => string;
}

function SessionItem({
  session,
  isActive,
  menuOpenId,
  renamingId,
  renameValue,
  renameRef,
  onLoad,
  onMenuToggle,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onDelete,
  onTogglePin,
  formatDate,
}: SessionItemProps) {
  const isMenuOpen = menuOpenId === session.id;
  const isRenaming = renamingId === session.id;

  return (
    <div className={`relative group rounded-lg mb-0.5 ${isActive ? "bg-indigo-50" : "hover:bg-zinc-50"}`}>
      {isRenaming ? (
        <div className="px-3 py-2">
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit(session.id);
              if (e.key === "Escape") onRenameChange("");
            }}
            onBlur={() => onRenameSubmit(session.id)}
            className="w-full text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      ) : (
        <div className="flex items-center gap-1 px-2 py-2.5">
          <button
            onClick={() => onLoad(session.id)}
            className="flex items-start gap-2 flex-1 min-w-0 text-left"
          >
            <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-indigo-500" : "text-zinc-400"}`} />
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate leading-snug ${isActive ? "text-indigo-700" : "text-zinc-700"}`}>
                {session.pinned && <Pin className="w-2.5 h-2.5 inline mr-1 text-indigo-400" />}
                {session.title}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">{formatDate(session.updated_at)}</p>
            </div>
          </button>

          {/* Three dots menu */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onMenuToggle(session.id); }}
              className={`p-1 rounded transition-colors ${isMenuOpen ? "text-zinc-600 bg-zinc-100" : "text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-zinc-600 hover:bg-zinc-100"}`}
              aria-label="Chat options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 w-40 py-1">
                <button
                  onClick={() => onRenameStart(session)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  <Pencil className="w-3.5 h-3.5 text-zinc-400" />
                  Rename
                </button>
                <button
                  onClick={() => onTogglePin(session.id, session.pinned)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  <Pin className="w-3.5 h-3.5 text-zinc-400" />
                  {session.pinned ? "Unpin" : "Pin to top"}
                </button>
                <div className="border-t border-zinc-100 my-1" />
                <button
                  onClick={() => onDelete(session.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
