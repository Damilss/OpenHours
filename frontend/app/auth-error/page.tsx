import Link from "next/link";

interface AuthErrorPageProps {
  searchParams: Promise<{ reason?: string; email?: string; error?: string }>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { reason, email, error } = await searchParams;

  const isDomainError = reason === "domain";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4 text-center">
            {/* Error icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-7 w-7 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {isDomainError ? "Access Denied" : "Authentication Error"}
            </h1>

            {isDomainError ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  The email address you signed in with is not from an approved
                  university domain.
                </p>
                {email && (
                  <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {email}
                  </p>
                )}
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Please sign in with your{" "}
                  <span className="font-semibold">.edu</span> university email
                  address to access AI Office Hours.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {error === "OAuthCallbackError"
                  ? "The sign-in process was cancelled or failed. Please try again."
                  : "Something went wrong during sign-in. Please try again."}
              </p>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          If you believe this is a mistake, contact your university&apos;s IT
          department or{" "}
          <a
            href="mailto:support@university.edu"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            reach out to support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
