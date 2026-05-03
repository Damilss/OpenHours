"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticate, setSession } from "@/lib/users";
import { Suspense } from "react";

function LoginCardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [activeTab, setActiveTab] = useState<"student" | "teacher">(
    registered === "teacher" ? "teacher" : "student"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    const result = authenticate(email.trim(), password, activeTab);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
      return;
    }

    setSession(result.user!);
    router.push(activeTab === "teacher" ? "/teacher" : "/classes");
  }

  return (
    <div className="rounded-2xl border border-zinc-300/60 bg-white/70 p-8 shadow-xl backdrop-blur-sm">
      <div className="space-y-5">
        {registered && (
          <div className="rounded-lg bg-[#2d4a3e]/10 px-3 py-2 text-sm text-[#2d4a3e]">
            ✓ Account created! Sign in as a {registered} below.
          </div>
        )}

        {/* Microsoft login (disabled) */}
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-200/80 px-6 py-3 text-sm font-semibold text-zinc-400 cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Sign in with Microsoft (coming soon)
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-white/70 px-2 text-zinc-400">or sign in with email</span></div>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab("student"); setError(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === "student"
                ? "bg-[#2d4a3e] text-white shadow-sm"
                : "border border-zinc-300 text-zinc-500 hover:border-[#2d4a3e]/30"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("teacher"); setError(""); }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              activeTab === "teacher"
                ? "bg-[#2d4a3e] text-white shadow-sm"
                : "border border-zinc-300 text-zinc-500 hover:border-[#2d4a3e]/30"
            }`}
          >
            Teacher
          </button>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#2d4a3e] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md"
          >
            Sign in as a {activeTab === "student" ? "Student" : "Teacher"}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a5a52]">
          To sign up:{" "}
          <Link href="/signup" className="font-semibold text-[#2d4a3e] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginCard() {
  return (
    <Suspense>
      <LoginCardInner />
    </Suspense>
  );
}
