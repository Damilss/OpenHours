import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span className="font-semibold text-lg">OpenHours</span>
        </div>
        
        <h1 className="text-6xl font-bold text-zinc-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-zinc-700 mb-4">
          Page not found
        </h2>
        <p className="text-zinc-500 mb-8 max-w-md">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
