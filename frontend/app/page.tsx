import Link from "next/link";
import {
  BookOpen,
  Brain,
  BarChart3,
  Clock,
  Shield,
  Lightbulb,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span className="font-semibold text-lg tracking-tight">OpenHours</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-24 bg-gradient-to-b from-indigo-50 to-white">
        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-4">
          Built for the Intellectual Pursuit track
        </span>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 max-w-2xl leading-tight">
          AI office hours that guide, not give away.
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-xl leading-relaxed">
          OpenHours gives students instant, scoped AI help based strictly on
          your course materials — and hints toward answers instead of handing
          them out.
        </p>
        <div className="flex gap-4 mt-10">
          <Link
            href="/auth/signup?role=professor"
            className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
          >
            I&apos;m a professor
          </Link>
          <Link
            href="/auth/signup?role=student"
            className="border border-zinc-200 text-zinc-700 px-6 py-3 rounded-full font-medium hover:bg-zinc-50 transition-colors"
          >
            I&apos;m a student
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="dark-section py-20 px-6">
        <div className="max-w-5xl mx-auto w-full">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Everything professors and students need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-5 h-5 text-indigo-400" />,
                title: "Scoped AI answers",
                desc: "The AI only answers from what you uploaded — no hallucinations, no off-topic shortcuts.",
              },
              {
                icon: <Lightbulb className="w-5 h-5 text-amber-400" />,
                title: "Tiered hints, not answers",
                desc: "Students get concept reminders, leading questions, and partial breakdowns — never the full solution.",
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
                title: "Professor analytics",
                desc: "See which topics students struggle with most so you can focus your time where it matters.",
              },
              {
                icon: <Clock className="w-5 h-5 text-sky-400" />,
                title: "24/7 availability",
                desc: "Students get help at 2am. You don't have to be there. Office hours are for the hard stuff.",
              },
              {
                icon: <Shield className="w-5 h-5 text-rose-400" />,
                title: "Academic integrity",
                desc: "Constrained to course content and designed to guide thinking, not replace it.",
              },
              {
                icon: <BookOpen className="w-5 h-5 text-violet-400" />,
                title: "Book real office hours",
                desc: "When AI isn't enough, students can request a real session directly from the chat.",
              },
            ].map((f) => (
              <div key={f.title} className="dark-card flex flex-col gap-3 p-6 rounded-2xl hover:border-zinc-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-zinc-800 mb-12">
            How it works
          </h2>
          <div className="flex flex-col gap-6">
            {[
              {
                step: "1",
                who: "Professor",
                action:
                  "Uploads course materials — PDFs, slides, or lecture videos.",
              },
              {
                step: "2",
                who: "OpenHours",
                action:
                  "Parses and indexes the content into a searchable knowledge base.",
              },
              {
                step: "3",
                who: "Student",
                action:
                  "Asks a question. The AI searches the course content and responds with a hint.",
              },
              {
                step: "4",
                who: "Student",
                action:
                  "If still stuck, requests a real office hours booking — sent straight to the professor.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {s.step}
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    {s.who}
                  </span>
                  <p className="text-zinc-700 mt-0.5">{s.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">
          Ready to transform office hours?
        </h2>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          Set up your course in minutes. Students get help instantly.
        </p>
        <Link
          href="/auth/signup"
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-100 py-6 px-8 flex items-center justify-between text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          <span>OpenHours</span>
        </div>
        <span>Built for KiroHacks · MIT License</span>
      </footer>
    </div>
  );
}
