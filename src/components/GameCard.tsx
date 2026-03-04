"use client";

import Link from "next/link";
import { GameMeta } from "@/types/game";

interface GameCardProps {
  game: GameMeta;
  highlighted?: boolean;
  onDelete: () => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function GameCard({ game, highlighted, onDelete }: GameCardProps) {
  return (
    <div
      className={`relative bg-white/5 border rounded-xl p-5 transition-all hover:bg-white/[0.07] group ${
        highlighted
          ? "border-[#FFD700]/50 animate-[highlightPulse_1.5s_ease-in-out_2]"
          : "border-white/10"
      }`}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.preventDefault(); onDelete(); }}
        className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
        title="Delete game"
      >
        <svg className="w-4 h-4 text-white/30 hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <h3 className="text-white font-bold text-lg mb-3 pr-8">{game.title}</h3>

      <div className="flex items-center gap-3 text-white/40 text-xs mb-4">
        <span>{game.questionCount} questions</span>
        <span className="text-white/20">&middot;</span>
        <span>{timeAgo(game.createdAt)}</span>
        {game.playCount > 0 && (
          <>
            <span className="text-white/20">&middot;</span>
            <span>{game.playCount} {game.playCount === 1 ? "play" : "plays"}</span>
          </>
        )}
      </div>

      <Link
        href={`/play/${game.id}`}
        className="inline-flex items-center gap-2 px-5 py-2 bg-[#FFD700] text-black font-bold text-sm rounded-lg hover:bg-[#FFD700]/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Play
      </Link>
    </div>
  );
}
