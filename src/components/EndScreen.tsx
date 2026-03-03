"use client";

import Link from "next/link";
import { PlayResult } from "@/types/game";

interface EndScreenProps {
  gameTitle: string;
  results: PlayResult[];
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
}

export default function EndScreen({ gameTitle, results }: EndScreenProps) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
  const percentage = Math.round((correct / total) * 100);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-white mb-2">Game Complete!</h2>
        <p className="text-white/60">{gameTitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-black text-[#FFD700]">
            {correct}/{total}
          </p>
          <p className="text-white/40 text-sm mt-1">Score</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-black text-[#FFD700]">{percentage}%</p>
          <p className="text-white/40 text-sm mt-1">Accuracy</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-black text-[#FFD700]">
            {formatTime(totalTime)}
          </p>
          <p className="text-white/40 text-sm mt-1">Total Time</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 border-b border-white/10 text-white/40 text-xs font-medium uppercase tracking-wider">
          <span>#</span>
          <span>Answer</span>
          <span>Time</span>
          <span>Result</span>
        </div>
        {results.map((result, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-white/5 last:border-0"
          >
            <span className="text-white/30 text-sm w-6">{i + 1}</span>
            <span className="text-white text-sm font-medium">
              {result.answer}
            </span>
            <span className="text-white/60 text-sm">
              {formatTime(result.timeTaken)}
            </span>
            <span
              className={`text-sm font-medium ${
                result.correct ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.correct ? "Correct" : "Wrong"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-8">
        <Link
          href="/"
          className="px-6 py-3 border border-white/10 text-white/60 font-bold rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          Back to Games
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
