import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-gradient-to-b from-indigo-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            Check your email
          </h1>
          <p className="text-zinc-600">
            We&apos;ve sent you a verification link. Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-zinc-900 mb-3">Next steps:</h2>
          <ol className="space-y-2 text-sm text-zinc-600">
            <li className="flex gap-2">
              <span className="font-semibold text-indigo-600">1.</span>
              <span>Open the email we sent you</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-indigo-600">2.</span>
              <span>Click the verification link</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-indigo-600">3.</span>
              <span>Return here and sign in</span>
            </li>
          </ol>
        </div>

        <div className="text-center text-sm text-zinc-500">
          <p className="mb-4">Didn&apos;t receive the email? Check your spam folder.</p>
          <Link
            href="/auth/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
