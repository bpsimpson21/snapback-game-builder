"use client";

import { useState } from "react";
import { GameQuestion } from "@/types/game";
import QuestionRow from "./QuestionRow";

interface StepGenerateProps {
  title: string;
  questions: GameQuestion[];
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type Phase = "idle" | "generating-answers" | "fetching-images" | "done";

export default function StepGenerate({
  title,
  questions,
  onQuestionsChange,
  onNext,
  onBack,
}: StepGenerateProps) {
  const [phase, setPhase] = useState<Phase>(questions.length > 0 ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = questions.filter((q) => q.selectedImage).length;
  const allSelected = questions.length === 20 && selectedCount === 20;

  async function handleGenerate() {
    setError(null);
    setPhase("generating-answers");

    try {
      // Phase 1: Generate answers
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!genRes.ok) {
        const data = await genRes.json();
        throw new Error(data.error || "Failed to generate answers");
      }

      const { answers } = await genRes.json();
      const newQuestions: GameQuestion[] = answers.map((answer: string) => ({
        answer,
        imageOptions: [],
        selectedImage: "",
      }));

      onQuestionsChange(newQuestions);
      setPhase("fetching-images");
      setProgress(0);

      // Phase 2: Fetch images for each answer (batch of 4 at a time)
      const batchSize = 4;
      for (let i = 0; i < newQuestions.length; i += batchSize) {
        const batch = newQuestions.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (q) => {
            try {
              const imgRes = await fetch("/api/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, answer: q.answer }),
              });
              if (!imgRes.ok) return [];
              const data = await imgRes.json();
              return data.images || [];
            } catch {
              return [];
            }
          })
        );

        results.forEach((images, j) => {
          newQuestions[i + j] = { ...newQuestions[i + j], imageOptions: images };
        });

        onQuestionsChange([...newQuestions]);
        setProgress(Math.min(i + batchSize, 20));
      }

      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }

  function handleSelectImage(questionIndex: number, imageUrl: string) {
    const updated = questions.map((q, i) =>
      i === questionIndex ? { ...q, selectedImage: imageUrl } : q
    );
    onQuestionsChange(updated);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Generate Questions</h2>
        <p className="text-[#FFD700] font-medium">&ldquo;{title}&rdquo;</p>
      </div>

      {phase === "idle" && (
        <div className="text-center">
          <button
            onClick={handleGenerate}
            className="px-8 py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 transition-colors"
          >
            Generate 20 Questions
          </button>
          <button
            onClick={onBack}
            className="block mx-auto mt-4 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            &larr; Change title
          </button>
          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
        </div>
      )}

      {phase === "generating-answers" && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60">
            AI is generating 20 answers for &ldquo;{title}&rdquo;...
          </p>
        </div>
      )}

      {phase === "fetching-images" && (
        <div className="text-center py-8 mb-6">
          <div className="inline-block w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/60 mb-2">
            Finding images... {progress}/20
          </p>
          <div className="w-64 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
              style={{ width: `${(progress / 20) * 100}%` }}
            />
          </div>
        </div>
      )}

      {(phase === "fetching-images" || phase === "done") && questions.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">
              {selectedCount}/20 images selected
            </p>
            {phase === "done" && (
              <button
                onClick={onBack}
                className="text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                &larr; Change title
              </button>
            )}
          </div>

          <div className="space-y-2">
            {questions.map((question, index) => (
              <QuestionRow
                key={index}
                index={index}
                question={question}
                onSelectImage={(url) => handleSelectImage(index, url)}
              />
            ))}
          </div>

          {phase === "done" && (
            <div className="mt-6 text-center">
              <button
                onClick={onNext}
                disabled={!allSelected}
                className="px-8 py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {allSelected
                  ? "Continue to Review"
                  : `Select images for all questions (${selectedCount}/20)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
