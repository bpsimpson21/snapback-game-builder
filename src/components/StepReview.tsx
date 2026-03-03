"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Game, GameQuestion } from "@/types/game";
import { saveGame } from "@/lib/game-store";

interface StepReviewProps {
  title: string;
  questions: GameQuestion[];
  onBack: () => void;
}

export default function StepReview({ title, questions, onBack }: StepReviewProps) {
  const router = useRouter();
  const [published, setPublished] = useState(false);

  function handlePublish() {
    const game: Game = {
      id: Date.now().toString(36),
      title,
      questions,
      createdAt: Date.now(),
      playCount: 0,
    };

    saveGame(game);

    // Copy play URL to clipboard
    const playUrl = `${window.location.origin}/play?id=${game.id}`;
    navigator.clipboard.writeText(playUrl).catch(() => {});

    // Show success state, then redirect to home with highlight
    setPublished(true);
    setTimeout(() => {
      router.push(`/?published=${game.id}`);
    }, 1500);
  }

  function handlePreview() {
    const game: Game = {
      id: "preview",
      title,
      questions,
      createdAt: Date.now(),
      playCount: 0,
    };
    localStorage.setItem("game-preview", JSON.stringify(game));
    window.open("/play?id=preview", "_blank");
  }

  if (published) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Game Published!</h2>
        <p className="text-white/60">Play link copied to clipboard. Redirecting to your games...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Review & Publish</h2>
        <p className="text-[#FFD700] font-medium">&ldquo;{title}&rdquo;</p>
        <p className="text-white/40 text-sm mt-1">{questions.length} questions ready</p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-8">
        {questions.map((q, i) => (
          <div key={i} className="group relative">
            <div className="aspect-square rounded-lg overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.selectedImage}
                alt={q.answer}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium text-center px-1">
                {q.answer}
              </span>
            </div>
            <span className="absolute top-1 left-1 bg-black/70 text-[#FFD700] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          &larr; Back to Edit
        </button>
        <button
          onClick={handlePreview}
          className="px-6 py-3 border border-[#FFD700]/30 text-[#FFD700] font-medium rounded-lg hover:bg-[#FFD700]/10 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={handlePublish}
          className="px-8 py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 transition-colors"
        >
          Publish Game
        </button>
      </div>

      <p className="text-white/30 text-xs text-center mt-4">
        Publishing saves to your library and copies the play link to clipboard
      </p>
    </div>
  );
}
