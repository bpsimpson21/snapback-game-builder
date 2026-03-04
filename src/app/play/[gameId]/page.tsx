"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Game } from "@/types/game";
import { fetchGameById } from "@/lib/supabase-games";
import PlayGame from "@/components/PlayGame";
import Header from "@/components/Header";

export default function PlayGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setError("No game ID provided");
      setLoading(false);
      return;
    }

    // Preview mode: load from localStorage
    if (gameId === "preview") {
      try {
        const stored = localStorage.getItem("game-preview");
        if (!stored) {
          setError("Preview not found. Try previewing from the builder again.");
          setLoading(false);
          return;
        }
        setGame(JSON.parse(stored) as Game);
      } catch {
        setError("Failed to load preview data");
      }
      setLoading(false);
      return;
    }

    // Fetch from Supabase
    fetchGameById(gameId)
      .then((g) => {
        if (!g) {
          setError("Game not found. The link may be invalid or the game was deleted.");
        } else {
          setGame(g);
        }
      })
      .catch(() => {
        setError("Failed to load game. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <Link href="/play" className="text-[#FFD700] hover:underline">
              &larr; Browse Games
            </Link>
          </div>
        </div>
      )}

      {game && (
        <div className="flex-1 py-8 px-6">
          <PlayGame game={game} />
        </div>
      )}
    </div>
  );
}
