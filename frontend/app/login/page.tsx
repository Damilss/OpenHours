import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage() {
  // If already authenticated, go straight to the app
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8e6df] px-4" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-md space-y-8">
        {/* University branding */}
        <div className="text-center">
          <Image
            src="/logo.jpg"
            alt="Open Hours logo"
            width={160}
            height={160}
            className="mx-auto rounded-2xl"
            priority
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">
            Open Hours
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your Teacher&apos;s Open Hours AI
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in with your university Microsoft account to get started
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-zinc-300 bg-white p-8 shadow-xl">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-zinc-900">
                Student Login
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Use your <span className="font-medium">.edu</span> email to
                verify your student status
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("microsoft-entra-id", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#2f2f2f] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1a1a1a] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                aria-label="Sign in with Microsoft"
              >
                {/* Microsoft logo */}
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
                Sign in with Microsoft
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-zinc-400">
                  University accounts only
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-400">
              Only students with a verified university email can access Open
              Hours. Your sign-in is handled securely through Microsoft.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Having trouble?{" "}
          <a
            href="mailto:support@university.edu"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Contact IT Support
          </a>
        </p>
      </div>
    </div>
  );
}
