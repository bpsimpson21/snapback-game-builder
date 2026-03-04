"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const isGames = pathname === "/" || pathname.startsWith("/play");
  const isBuilder = pathname === "/builder";

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center font-black text-black text-sm">
            S
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Snapback Sports
          </span>
        </Link>

        <span className="text-white/20 text-sm">|</span>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isGames
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            Games
          </Link>
          <Link
            href="/builder"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isBuilder
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
}
