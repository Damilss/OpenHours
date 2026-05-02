import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8e6df] px-4 text-zinc-900">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Image
            src="/logo.jpg"
            alt="Open Hours logo"
            width={160}
            height={160}
            className="mx-auto rounded-2xl"
            priority
          />
          <p className="mt-4 text-sm text-[#5a5a52]">
            Sign in to get started
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-zinc-300 bg-white p-8 shadow-xl">
          <div className="space-y-4">
            {/* Microsoft login (disabled) */}
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-200 px-6 py-3.5 text-sm font-semibold text-zinc-400 cursor-not-allowed"
              aria-label="Sign in with Microsoft (coming soon)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 21 21"
                aria-hidden="true"
              >
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft (coming soon)
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-zinc-400">
                  or continue as
                </span>
              </div>
            </div>

            {/* Student login */}
            <Link
              href="/classes"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d4a3e] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1e3a2e] hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Student Login
            </Link>

            {/* Teacher login */}
            <Link
              href="/teacher"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#2d4a3e] px-6 py-3.5 text-sm font-semibold text-[#2d4a3e] shadow-sm transition-all hover:bg-[#2d4a3e] hover:text-white hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              Teacher Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
