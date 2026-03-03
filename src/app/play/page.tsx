"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Game } from "@/types/game";
import { incrementPlayCount } from "@/lib/game-store";
import PlayGame from "@/components/PlayGame";
import Header from "@/components/Header";

function PlayContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError("No game ID provided");
      return;
    }

    const key = gameId === "preview" ? "game-preview" : `game-${gameId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      setError("Game not found. The link may have expired or the game was created on a different device.");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Game;
      setGame(parsed);

      // Increment play count (skip for preview)
      if (gameId !== "preview") {
        incrementPlayCount(gameId);
      }
    } catch {
      setError("Failed to load game data");
    }
  }, [gameId]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link
            href="/"
            className="text-[#FFD700] hover:underline"
          >
            &larr; Back to Games
          </Link>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-6">
      <PlayGame game={game} />
    </div>
  );
}

export default function PlayPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <PlayContent />
      </Suspense>
    </div>
  );
}
