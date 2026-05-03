import Image from "next/image";
import Link from "next/link";
import FadeIn from "../fade-in";
import LoginCard from "./login-card";

export default function LoginPage() {
  return (
    <div className="bg-gradient-to-b from-[#dddbd4] via-[#e4e2db] to-[#dddbd4] text-zinc-900">
      {/* Hero / Login */}
      <section id="top" className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#d4e4cc] via-[#dfe8d8] to-[#dddbd4] px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Image src="/logo.jpg" alt="Open Hours logo" width={184} height={184} className="mx-auto rounded-2xl" priority />
            <p className="mt-4 text-sm text-[#5a5a52]">Sign in to get started</p>
          </div>
          <LoginCard />
        </div>
        <div className="mt-12 animate-bounce text-zinc-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </div>
      </section>

      {/* Campus photo — fades in on scroll */}
      <FadeIn>
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
          <Image src="/campus.avif" alt="Cal Poly campus aerial view" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#2d4a3e]/50" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#dddbd4] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#dddbd4] to-transparent" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              A space for students to ask for help<br />
              <span className="text-[#b8d4a8]">beyond office hours.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Open Hours is a specialized class bot that guides your thinking with hints — never hands you the answer. Get unstuck at 2am, the night before an exam, or whenever you need a nudge.
            </p>
          </div>
        </section>
      </FadeIn>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#2d4a3e]/40">How it works</h3>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <FadeIn>
              <div className="rounded-2xl border border-[#2d4a3e]/10 bg-white/50 p-8 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d4a3e]/10 text-2xl">🤖</div>
                <h4 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-bold text-[#1d1d1f]">AI That Teaches, Not Tells</h4>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">Our AI uses a tiered hint system — starting with a concept reminder, then a guiding question, then a partial walkthrough. You build understanding instead of copying answers.</p>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="rounded-2xl border border-[#2d4a3e]/10 bg-white/50 p-8 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d4a3e]/10 text-2xl">📚</div>
                <h4 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-bold text-[#1d1d1f]">Your Professor&apos;s Materials, Built In</h4>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">Teachers upload slides, PDFs, and notes directly into Open Hours. The AI references these materials alongside curated resources from Khan Academy, 3Blue1Brown, and more.</p>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="rounded-2xl border border-[#2d4a3e]/10 bg-white/50 p-8 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2d4a3e]/10 text-2xl">📊</div>
                <h4 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-bold text-[#1d1d1f]">Teachers See What Students Need</h4>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">Every question is tracked and summarized. Teachers get a dashboard showing which topics students struggle with most, so they can adjust lectures and focus office hours where it matters.</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-xs"><div className="h-px bg-[#2d4a3e]/10" /></div>

      {/* Student / Teacher Split */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-8 md:grid-cols-2">
          <FadeIn>
            <div className="rounded-2xl border border-[#2d4a3e]/10 bg-white/50 p-10 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#2d4a3e]/50">For Students</p>
              <h4 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#1d1d1f]">Get unstuck without the guilt</h4>
              <ul className="mt-6 space-y-4 text-sm text-zinc-600">
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Ask questions any time — no waiting for office hours</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Get guided hints, not copy-paste answers</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Access your professor&apos;s own materials and curated resources</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Chat with classmates in the built-in class chat</li>
              </ul>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="rounded-2xl border border-[#2d4a3e]/10 bg-white/50 p-10 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#2d4a3e]/50">For Teachers</p>
              <h4 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#1d1d1f]">Know exactly where students struggle</h4>
              <ul className="mt-6 space-y-4 text-sm text-zinc-600">
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>See a real-time summary of student struggles per class</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Upload course materials the AI uses to support students</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Identify at-risk students who need extra help</li>
                <li className="flex items-start gap-3"><span className="mt-0.5 text-[#2d4a3e]">✓</span>Preview the student experience from your dashboard</li>
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-xs"><div className="h-px bg-[#2d4a3e]/10" /></div>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#1d1d1f]">Office hours end. Learning doesn&apos;t have to.</h3>
          <p className="mt-4 text-base text-[#5a5a52]">Open Hours gives every student a patient, knowledgeable tutor that&apos;s available whenever they need it — and gives teachers the insight to make every class better.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/signup" className="rounded-xl bg-[#2d4a3e] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md">Sign Up</Link>
            <a href="#top" className="rounded-xl border-2 border-[#2d4a3e] px-8 py-3.5 text-sm font-semibold text-[#2d4a3e] transition-all hover:bg-[#2d4a3e] hover:text-white">Sign In</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#2d4a3e]/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs text-zinc-400">© 2026 Open Hours · Built by Emilio Ledesma</p>
          <p className="text-xs text-zinc-400">AI Office Hours · Hackathon Project</p>
        </div>
      </footer>
    </div>
  );
}
