import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Open Hours logo"
              width={36}
              height={36}
            />
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Open Hours
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome, {user.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              You&apos;re signed in as a verified student. Open Hours is
              ready to help you work through problems — without giving away the
              answers.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The tutoring interface will appear here. For now, your
              authentication is set up and working.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
