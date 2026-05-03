"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addUser, findUserByEmail } from "@/lib/users";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !school.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (findUserByEmail(email)) {
      setError("An account with that email already exists.");
      return;
    }

    addUser({
      id: String(Date.now()),
      name: name.trim(),
      school: school.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });

    router.push(`/login?registered=${role}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#d4e4cc] via-[#dfe8d8] to-[#dddbd4] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            src="/logo.jpg"
            alt="Open Hours logo"
            width={120}
            height={120}
            className="mx-auto rounded-2xl"
            priority
          />
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#1d1d1f]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[#5a5a52]">
            Join Open Hours as a student or teacher
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-300/60 bg-white/70 p-8 shadow-xl backdrop-blur-sm"
        >
          <div className="space-y-4">
            {/* Role toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2d4a3e]/50 mb-2">
                I am a
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    role === "student"
                      ? "bg-[#2d4a3e] text-white shadow-sm"
                      : "border border-zinc-300 text-zinc-500 hover:border-[#2d4a3e]/30"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    role === "teacher"
                      ? "bg-[#2d4a3e] text-white shadow-sm"
                      : "border border-zinc-300 text-zinc-500 hover:border-[#2d4a3e]/30"
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
              />
            </div>

            {/* School */}
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-zinc-700">
                School / University
              </label>
              <input
                id="school"
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Cal Poly San Luis Obispo"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jdoe@calpoly.edu"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-[#2d4a3e] focus:outline-none focus:ring-2 focus:ring-[#2d4a3e]/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#2d4a3e] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md"
            >
              Create Account
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#5a5a52]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#2d4a3e] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
