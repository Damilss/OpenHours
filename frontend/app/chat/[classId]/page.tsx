"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, use } from "react";
import { addStruggle, detectTopic } from "@/lib/struggles";
import type { Struggle } from "@/lib/struggles";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  hintLevel: number;
}

const SAMPLE_HISTORY: Record<string, Conversation[]> = {
  "1": [
    {
      id: "csc-1",
      title: "Binary search complexity",
      hintLevel: 1,
      messages: [
        { id: "s1", role: "user", content: "Why is binary search O(log n)?" },
        {
          id: "s2",
          role: "assistant",
          content:
            "Think about what happens to the search space each time you compare the middle element. How much of the array can you eliminate?",
        },
      ],
    },
    {
      id: "csc-2",
      title: "Recursion base case",
      hintLevel: 1,
      messages: [
        { id: "s3", role: "user", content: "My recursive function runs forever" },
        {
          id: "s4",
          role: "assistant",
          content:
            "Every recursive function needs a stopping point. What condition should tell your function to stop calling itself?",
        },
      ],
    },
  ],
  "2": [
    {
      id: "math-1",
      title: "Chain rule application",
      hintLevel: 1,
      messages: [
        { id: "m1", role: "user", content: "How do I differentiate sin(x\u00B2)?" },
        {
          id: "m2",
          role: "assistant",
          content:
            "This is a composition of two functions. What rule do we use when one function is inside another? Think about the outer and inner functions separately.",
        },
      ],
    },
  ],
  "3": [
    {
      id: "phys-1",
      title: "Free body diagram",
      hintLevel: 1,
      messages: [
        { id: "p1", role: "user", content: "I don't know where to start with this force problem" },
        {
          id: "p2",
          role: "assistant",
          content:
            "Start by identifying all the forces acting on the object. Can you draw a free body diagram? What forces do you see?",
        },
      ],
    },
  ],
};

const CLASS_NAMES: Record<string, string> = {
  "1": "CSC 101",
  "2": "MATH 141",
  "3": "PHYS 141",
};

// Tiered hint responses based on how many times the student has asked in this conversation
const HINT_RESPONSES: Record<number, string> = {
  1: "Let me give you a nudge in the right direction.\n\nThink about what concept from class might apply here. What key idea connects to this problem?",
  2: "Let me ask you a guiding question.\n\nWhat would happen if you broke this problem into smaller parts? Which piece would you tackle first, and what tools or formulas might help with just that piece?",
  3: "Let me walk you through part of this.\n\nHere\u2019s how to start: identify the core variables and relationships in the problem. Set up the first step, then see if the pattern becomes clearer from there. What do you get when you try that?",
};

export default function ChatPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);

  const [conversations, setConversations] = useState<Conversation[]>(
    SAMPLE_HISTORY[classId] ?? []
  );
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const messages = activeConvo?.messages ?? [];
  const className = CLASS_NAMES[classId] ?? "Class";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  function startNewChat() {
    setActiveConvoId(null);
    setInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: input.trim(),
    };

    let convoId = activeConvoId;
    let currentHintLevel = 1;

    if (!convoId) {
      const newConvo: Conversation = {
        id: String(Date.now()),
        title:
          input.trim().length > 40
            ? input.trim().slice(0, 40) + "\u2026"
            : input.trim(),
        messages: [userMessage],
        hintLevel: 1,
      };
      setConversations((prev) => [newConvo, ...prev]);
      setActiveConvoId(newConvo.id);
      convoId = newConvo.id;
      currentHintLevel = 1;
    } else {
      const convo = conversations.find((c) => c.id === convoId);
      currentHintLevel = Math.min((convo?.hintLevel ?? 0) + 1, 3);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId
            ? { ...c, messages: [...c.messages, userMessage], hintLevel: currentHintLevel }
            : c
        )
      );
    }

    // Track the struggle
    const topic = detectTopic(input.trim());
    const struggle: Struggle = {
      id: String(Date.now()),
      classId,
      studentName: "Current Student", // placeholder until auth is wired up
      topic,
      question: input.trim(),
      hintLevel: currentHintLevel,
      timestamp: Date.now(),
    };
    addStruggle(struggle);

    setInput("");
    setIsLoading(true);

    const targetId = convoId;
    const hintText =
      HINT_RESPONSES[currentHintLevel] ?? HINT_RESPONSES[3];

    setTimeout(() => {
      const assistantMessage: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: hintText,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, messages: [...c.messages, assistantMessage] }
            : c
        )
      );
      setIsLoading(false);
    }, 1200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div
      className="flex h-screen bg-[#e9e7e0]"
      style={{ colorScheme: "light" }}
    >
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-72" : "w-0"} shrink-0 overflow-hidden border-r border-[#d4d2cb] bg-white/60 backdrop-blur-sm transition-all duration-200`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-[#d4d2cb] px-4 py-3">
            <span className="text-sm font-semibold text-[#2d4a3e]">{className} History</span>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/10"
              aria-label="New chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              New
            </button>
          </div>

          {/* Conversation list */}
          <nav className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-zinc-400">
                No conversations yet
              </p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((convo) => (
                  <li key={convo.id}>
                    <button
                      onClick={() => setActiveConvoId(convo.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                        activeConvoId === convo.id
                          ? "bg-[#2d4a3e]/10 text-[#2d4a3e]"
                          : "text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      <p className="truncate text-sm font-medium">
                        {convo.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {convo.messages.length} message{convo.messages.length !== 1 ? "s" : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/10"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>

            <Link
              href="/classes"
              className="flex items-center gap-1 text-sm font-medium text-[#2d4a3e] transition-colors hover:text-[#1e3a2e]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Classes
            </Link>

            <div className="h-5 w-px bg-[#d4d2cb]" />

            <Image src="/logo.jpg" alt="Open Hours logo" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold text-[#2d4a3e]">
              {className} — {activeConvo ? activeConvo.title : "New Chat"}
            </span>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <Image src="/logo.jpg" alt="Open Hours logo" width={80} height={80} className="rounded-2xl opacity-60" />
                <h2 className="mt-6 text-xl font-semibold text-[#2d4a3e]">
                  What are you working on in {className}?
                </h2>
                <p className="mt-2 max-w-md text-sm text-[#5a5a52]">
                  Describe the problem you&apos;re stuck on. I&apos;ll guide your thinking with hints — not answers.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#2d4a3e] text-white"
                        : "border border-[#d4d2cb] bg-white text-zinc-800"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-[#d4d2cb] bg-white px-5 py-4">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#2d4a3e]/40 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#2d4a3e]/40 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-[#2d4a3e]/40 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input area */}
        <div className="shrink-0 border-t border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you're stuck on..."
                rows={1}
                className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
                style={{ maxHeight: "160px" }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#2d4a3e] text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </form>
          <p className="pb-3 text-center text-xs text-zinc-400">
            Open Hours guides your thinking — it won&apos;t give you direct answers.
          </p>
        </div>
      </div>
    </div>
  );
}
