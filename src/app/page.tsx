"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GameMeta } from "@/types/game";
import { fetchPublishedGames, deletePublishedGame } from "@/lib/supabase-games";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";

function HomeContent() {
  const searchParams = useSearchParams();
  const publishedId = searchParams.get("published");
  const [games, setGames] = useState<GameMeta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPublishedGames()
      .then((g) => setGames(g))
      .catch(() => setGames([]))
      .finally(() => setLoaded(true));
  }, []);

  async function handleDelete(id: string) {
    try {
      await deletePublishedGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch {
      // Silently fail for demo
    }
  }

  return (
    <main className="flex-1 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero / CTA */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Your Games</h1>
            <p className="text-white/50 text-sm">
              Create and play &ldquo;Name That X&rdquo; trivia games
            </p>
          </div>
          <Link
            href="/builder"
            className="px-6 py-3 bg-[#FFD700] text-black font-bold rounded-lg text-sm hover:bg-[#FFD700]/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New Game
          </Link>
        </div>

        {/* Game grid */}
        {loaded && games.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                highlighted={game.id === publishedId}
                onDelete={() => handleDelete(game.id)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {loaded && games.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-4">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No games yet</h2>
            <p className="text-white/40 mb-6">Create your first &ldquo;Name That X&rdquo; trivia game!</p>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create New Game
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function HomePage() {
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
        <HomeContent />
      </Suspense>

      <footer className="border-t border-white/5 py-4 text-center">
        <p className="text-white/20 text-xs">
          Snapback Sports &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
