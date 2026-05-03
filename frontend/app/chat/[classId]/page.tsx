"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { addStruggle, detectTopic } from "@/lib/struggles";
import type { Struggle } from "@/lib/struggles";
import { getResourcesForTopic, formatResourceEmoji } from "@/lib/resources";
import { getMaterialsForClass } from "@/lib/materials";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface GroupMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isMe: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  hintLevel: number;
}

const SAMPLE_HISTORY: Record<string, Conversation[]> = {
  "1": [
    { id: "csc-1", title: "Binary search complexity", hintLevel: 1, messages: [
      { id: "s1", role: "user", content: "Why is binary search O(log n)?" },
      { id: "s2", role: "assistant", content: "Think about what happens to the search space each time you compare the middle element. How much of the array can you eliminate?" },
    ]},
    { id: "csc-2", title: "Recursion base case", hintLevel: 1, messages: [
      { id: "s3", role: "user", content: "My recursive function runs forever" },
      { id: "s4", role: "assistant", content: "Every recursive function needs a stopping point. What condition should tell your function to stop calling itself?" },
    ]},
  ],
  "2": [
    { id: "math-1", title: "Chain rule application", hintLevel: 1, messages: [
      { id: "m1", role: "user", content: "How do I differentiate sin(x\u00B2)?" },
      { id: "m2", role: "assistant", content: "This is a composition of two functions. What rule do we use when one function is inside another? Think about the outer and inner functions separately." },
    ]},
  ],
  "3": [
    { id: "phys-1", title: "Free body diagram", hintLevel: 1, messages: [
      { id: "p1", role: "user", content: "I don't know where to start with this force problem" },
      { id: "p2", role: "assistant", content: "Start by identifying all the forces acting on the object. Can you draw a free body diagram? What forces do you see?" },
    ]},
  ],
};

const SAMPLE_GROUP_MESSAGES: Record<string, GroupMessage[]> = {
  "1": [
    { id: "g1", sender: "Alex M.", content: "Anyone else confused by the linked list homework?", timestamp: Date.now() - 3600000, isMe: false },
    { id: "g2", sender: "Sarah K.", content: "Yeah the insert method is tricky. I keep getting null pointer errors", timestamp: Date.now() - 3400000, isMe: false },
    { id: "g3", sender: "Alex M.", content: "Same! I think we need to handle the edge case where the list is empty", timestamp: Date.now() - 3200000, isMe: false },
    { id: "g4", sender: "Jordan P.", content: "Try checking if head is null before traversing. That fixed it for me", timestamp: Date.now() - 2800000, isMe: false },
  ],
  "2": [
    { id: "g5", sender: "Maria L.", content: "Is the midterm going to cover integration by parts?", timestamp: Date.now() - 7200000, isMe: false },
    { id: "g6", sender: "Chris W.", content: "Prof said everything through chapter 6", timestamp: Date.now() - 6800000, isMe: false },
    { id: "g7", sender: "Maria L.", content: "Thanks! Anyone want to form a study group?", timestamp: Date.now() - 6400000, isMe: false },
  ],
  "3": [
    { id: "g8", sender: "Taylor R.", content: "The lab report is due Friday right?", timestamp: Date.now() - 5400000, isMe: false },
    { id: "g9", sender: "Sam D.", content: "Yeah, and don't forget to include error analysis this time", timestamp: Date.now() - 5000000, isMe: false },
  ],
};

const CLASS_NAMES: Record<string, string> = {
  "1": "CSC 101",
  "2": "MATH 141",
  "3": "PHYS 141",
};

// Detect the student's emotional/cognitive state from their message
function detectStudentState(message: string, history: Message[]): "new_question" | "confused" | "frustrated" | "followup" | "vague" {
  const lower = message.toLowerCase();
  const frustrated = /don'?t understand|still confused|makes no sense|i give up|lost|no idea|what\??$|huh|help me|i can'?t|doesn'?t make sense|stuck|clueless/i;
  const confused = /confused|not sure|don'?t get|don'?t know|what do you mean|can you explain|i don'?t see|unclear|how does that/i;
  const vague = /^.{1,15}$|^(ok|okay|yes|no|yeah|sure|hmm|idk|what|why|how)\.?$/i;

  if (frustrated.test(lower)) return "frustrated";
  if (confused.test(lower)) return "confused";
  if (vague.test(lower)) return "vague";
  if (history.length > 0) return "followup";
  return "new_question";
}

function buildResponse(message: string, hintLevel: number, topic: string, classId: string, history: Message[]): string {
  const state = detectStudentState(message, history);
  const topicLabel = topic === "General" ? "this problem" : topic;
  let base = "";

  if (state === "frustrated" || state === "confused") {
    // Don't pretend they're making progress — acknowledge the struggle
    if (hintLevel <= 1) {
      base = `That's okay — ${topicLabel} can be tricky, and it's completely normal to feel stuck here. Let's slow down and take a different angle.\n\nForget the full problem for a moment. Can you tell me what part specifically feels confusing? Is it the concept itself, or how to apply it? Narrowing down where you're stuck will help me guide you better.`;
    } else if (hintLevel === 2) {
      base = `I hear you — let's try a completely different approach to ${topicLabel}.\n\nInstead of working through the problem directly, let me give you a simpler version of the same idea. Imagine a basic example first: what would happen in the simplest possible case? Once that clicks, we can build back up to your actual problem.`;
    } else {
      base = `I can see this is really challenging. Let me break ${topicLabel} down step by step without skipping anything.\n\nHere's the foundation: start by writing down every piece of information the problem gives you. Then identify what you're solving for. The connection between those two things is where the key concept lives. What do you have so far when you list out the givens?`;
    }
  } else if (state === "vague") {
    base = `Could you tell me a bit more about what you're working on? The more detail you give me — like the specific problem, what you've tried, or where you got stuck — the better I can guide you.\n\nFor example, are you working on a homework problem, studying for an exam, or trying to understand a concept from lecture?`;
  } else if (state === "followup") {
    if (hintLevel <= 1) {
      base = `Good, you're engaging with ${topicLabel}. Let me push your thinking a bit further.\n\nBased on what we've discussed, what's the next logical step? Think about what connects what you already know to what you're trying to find. What relationship or rule bridges that gap?`;
    } else if (hintLevel === 2) {
      base = `Let's dig deeper into ${topicLabel}. Here's a guiding question:\n\nIf you had to explain this problem to a classmate, what would you say the main challenge is? Sometimes articulating the difficulty out loud reveals the path forward. What's the one thing that, if you understood it, would unlock the rest?`;
    } else {
      base = `Let me give you more structure for ${topicLabel}.\n\nHere's a concrete first step: take the core formula or definition that applies here and write it out. Then plug in what you know from the problem. What does that give you? Don't worry about the final answer yet — just get through that first substitution and tell me what you see.`;
    }
  } else {
    // New question
    base = `It looks like you're working on ${topicLabel}. Let's work through this together.\n\nBefore I guide you, tell me: what have you tried so far, and where did you get stuck? Understanding your starting point helps me give you the right nudge instead of repeating what you already know.`;
  }

  // Check for professor-uploaded materials
  const materials = getMaterialsForClass(classId);
  let materialsNote = "";
  if (materials.length > 0) {
    const relevant = materials.slice(0, 2);
    materialsNote = `\n\n📂 Your professor has uploaded materials that may help:\n${relevant.map((m) => `  • ${m.fileName}`).join("\n")}\nCheck those for worked examples or explanations that relate to your question.`;
  }

  // Add external resources
  const resources = getResourcesForTopic(topic);
  let resourcesNote = "";
  if (resources.length > 0) {
    resourcesNote = `\n\n📚 Here are some resources to deepen your understanding:\n${resources.slice(0, 2).map((r) => `  ${formatResourceEmoji(r.type)} ${r.title}\n     ${r.url}`).join("\n")}`;
  }

  return base + materialsNote + resourcesNote;
}

export default function ChatPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  return (
    <Suspense>
      <ChatContent key={classId} classId={classId} />
    </Suspense>
  );
}

function ChatContent({ classId }: { classId: string }) {
  const searchParams = useSearchParams();
  const isTeacherPreview = searchParams.get("role") === "teacher";

  const [activeTab, setActiveTab] = useState<"ai" | "group">("ai");
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_HISTORY[classId] ?? []);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(SAMPLE_GROUP_MESSAGES[classId] ?? []);
  const [groupInput, setGroupInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const groupTextareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const messages = activeConvo?.messages ?? [];
  const className = CLASS_NAMES[classId] ?? "Class";

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { groupEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [groupMessages]);

  useEffect(() => {
    const ref = activeTab === "ai" ? textareaRef : groupTextareaRef;
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [input, groupInput, activeTab]);

  function startNewChat() { setActiveConvoId(null); setInput(""); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: String(Date.now()), role: "user", content: input.trim() };
    let convoId = activeConvoId;
    let currentHintLevel = 1;
    if (!convoId) {
      const newConvo: Conversation = {
        id: String(Date.now()),
        title: input.trim().length > 40 ? input.trim().slice(0, 40) + "\u2026" : input.trim(),
        messages: [userMessage], hintLevel: 1,
      };
      setConversations((prev) => [newConvo, ...prev]);
      setActiveConvoId(newConvo.id);
      convoId = newConvo.id;
    } else {
      const convo = conversations.find((c) => c.id === convoId);
      currentHintLevel = Math.min((convo?.hintLevel ?? 0) + 1, 3);
      setConversations((prev) => prev.map((c) => c.id === convoId ? { ...c, messages: [...c.messages, userMessage], hintLevel: currentHintLevel } : c));
    }
    const topic = detectTopic(input.trim());
    const struggle: Struggle = { id: String(Date.now()), classId, studentName: "Current Student", topic, question: input.trim(), hintLevel: currentHintLevel, timestamp: Date.now() };
    addStruggle(struggle);
    const userQuestion = input.trim();
    setInput(""); setIsLoading(true);
    const targetId = convoId;
    const currentMessages = conversations.find((c) => c.id === targetId)?.messages ?? [];
    const hintText = buildResponse(userQuestion, currentHintLevel, topic, classId, currentMessages);
    setTimeout(() => {
      const assistantMessage: Message = { id: String(Date.now() + 1), role: "assistant", content: hintText };
      setConversations((prev) => prev.map((c) => c.id === targetId ? { ...c, messages: [...c.messages, assistantMessage] } : c));
      setIsLoading(false);
    }, 1200);
  }

  function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupInput.trim()) return;
    const msg: GroupMessage = { id: String(Date.now()), sender: "You", content: groupInput.trim(), timestamp: Date.now(), isMe: true };
    setGroupMessages((prev) => [...prev, msg]);
    setGroupInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  }

  function handleGroupKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGroupSubmit(e); }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex h-screen bg-[#e9e7e0] relative" style={{ colorScheme: "light" }}>
      {isTeacherPreview && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1.5 animate-border-flow bg-gradient-to-r from-[#2d4a3e] via-[#9b72cf] to-[#2d4a3e]" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-1.5 animate-border-flow bg-gradient-to-r from-[#9b72cf] via-[#2d4a3e] to-[#9b72cf]" />
          <div className="pointer-events-none fixed inset-y-0 left-0 z-50 w-1.5 animate-border-flow bg-gradient-to-b from-[#2d4a3e] via-[#9b72cf] to-[#2d4a3e]" />
          <div className="pointer-events-none fixed inset-y-0 right-0 z-50 w-1.5 animate-border-flow bg-gradient-to-b from-[#9b72cf] via-[#2d4a3e] to-[#9b72cf]" />
        </>
      )}

      {/* Sidebar — only show for AI tab */}
      {activeTab === "ai" && (
        <aside className={`${sidebarOpen ? "w-72" : "w-0"} shrink-0 overflow-hidden border-r border-[#d4d2cb] bg-white/60 backdrop-blur-sm transition-all duration-300 ease-in-out`}>
          <div className="flex h-full w-72 flex-col">
            <div className="flex items-center justify-between border-b border-[#d4d2cb] px-4 py-3">
              <span className="text-sm font-semibold text-[#2d4a3e]">{className} History</span>
              <button onClick={startNewChat} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/10" aria-label="New chat">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                New
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-zinc-400">No conversations yet</p>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((convo) => (
                    <li key={convo.id}>
                      <button onClick={() => setActiveConvoId(convo.id)} className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${activeConvoId === convo.id ? "bg-[#2d4a3e]/10 text-[#2d4a3e]" : "text-zinc-600 hover:bg-zinc-100"}`}>
                        <p className="truncate text-sm font-medium">{convo.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{convo.messages.length} message{convo.messages.length !== 1 ? "s" : ""}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {isTeacherPreview && (
          <div className="shrink-0 bg-gradient-to-r from-[#2d4a3e]/10 via-[#d4c5d8]/30 to-[#2d4a3e]/10 px-6 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#2d4a3e]/70">👁 You are viewing as a student</p>
              <Link href="/teacher" className="text-xs font-semibold text-[#2d4a3e] hover:underline">← Back to Teacher Dashboard</Link>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="shrink-0 border-b border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            {activeTab === "ai" && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#2d4a3e] transition-colors hover:bg-[#2d4a3e]/10" aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></svg>
              </button>
            )}
            <Link href={`/classes${isTeacherPreview ? "?role=teacher" : ""}`} className="flex items-center gap-1 text-sm font-medium text-[#2d4a3e] transition-colors hover:text-[#1e3a2e]">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Classes
            </Link>
            <div className="h-5 w-px bg-[#d4d2cb]" />
            <span className="text-sm font-semibold text-[#2d4a3e]">{className}</span>
          </div>
        </header>

        {/* Tabs */}
        <div className="shrink-0 flex border-b border-[#d4d2cb] bg-white/60">
          <button onClick={() => setActiveTab("ai")} className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "ai" ? "border-b-2 border-[#2d4a3e] text-[#2d4a3e]" : "text-zinc-400 hover:text-zinc-600"}`}>
            🤖 AI Tutor
          </button>
          <button onClick={() => setActiveTab("group")} className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === "group" ? "border-b-2 border-[#2d4a3e] text-[#2d4a3e]" : "text-zinc-400 hover:text-zinc-600"}`}>
            💬 Class Chat
          </button>
        </div>

        {activeTab === "ai" ? (
          <div key="ai" className="flex flex-1 flex-col animate-content-in">
            {/* AI Messages */}
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-24 text-center">
                    <h2 className="text-xl font-semibold text-[#2d4a3e]">What are you working on in {className}?</h2>
                    <p className="mt-2 max-w-md text-sm text-[#5a5a52]">Describe the problem you&apos;re stuck on. I&apos;ll guide your thinking with hints — not answers.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-[#2d4a3e] text-white" : "border border-[#d4d2cb] bg-white text-zinc-800"}`}>
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
            {/* AI Input */}
            <div className="shrink-0 border-t border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
                <div className="relative flex-1">
                  <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isTeacherPreview ? "View only — teacher preview mode" : "Describe what you're stuck on..."} rows={1} disabled={isTeacherPreview} className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" style={{ maxHeight: "160px" }} />
                </div>
                <button type="submit" disabled={isTeacherPreview || !input.trim() || isLoading} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#2d4a3e] text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500" aria-label="Send message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                </button>
              </form>
              <p className="pb-3 text-center text-xs text-zinc-400">Open Hours guides your thinking — it won&apos;t give you direct answers.</p>
            </div>
          </div>
        ) : (
          <div key="group" className="flex flex-1 flex-col animate-content-in">
            {/* Group Chat Messages */}
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl px-6 py-6">
                {groupMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-24 text-center">
                    <h2 className="text-xl font-semibold text-[#2d4a3e]">{className} Class Chat</h2>
                    <p className="mt-2 max-w-md text-sm text-[#5a5a52]">Chat with your classmates. Ask questions, share ideas, or form study groups.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${msg.isMe ? "" : ""}`}>
                          {!msg.isMe && (
                            <p className="mb-1 ml-1 text-xs font-semibold text-[#2d4a3e]">{msg.sender}</p>
                          )}
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.isMe ? "bg-[#2d4a3e] text-white" : "border border-[#d4d2cb] bg-white text-zinc-800"}`}>
                            <p>{msg.content}</p>
                          </div>
                          <p className={`mt-1 text-[10px] text-zinc-400 ${msg.isMe ? "text-right mr-1" : "ml-1"}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={groupEndRef} />
                  </div>
                )}
              </div>
            </main>
            {/* Group Chat Input */}
            <div className="shrink-0 border-t border-[#d4d2cb] bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleGroupSubmit} className="mx-auto flex max-w-3xl items-end gap-3 px-6 py-4">
                <div className="relative flex-1">
                  <textarea ref={groupTextareaRef} value={groupInput} onChange={(e) => setGroupInput(e.target.value)} onKeyDown={handleGroupKeyDown} placeholder={isTeacherPreview ? "View only — teacher preview mode" : "Message your classmates..."} rows={1} disabled={isTeacherPreview} className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-5 py-3.5 pr-12 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400" style={{ maxHeight: "160px" }} />
                </div>
                <button type="submit" disabled={isTeacherPreview || !groupInput.trim()} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#2d4a3e] text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500" aria-label="Send message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom-left logo */}
      <div className="fixed bottom-4 left-4 z-40">
        <Image src="/logo.jpg" alt="Open Hours logo" width={72} height={72} className="rounded-xl opacity-80 shadow-lg" />
      </div>
    </div>
  );
}
