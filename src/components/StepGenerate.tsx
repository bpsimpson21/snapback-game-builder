"use client";

import { useState, useRef } from "react";
import { GameQuestion } from "@/types/game";
import QuestionRow from "./QuestionRow";

interface StepGenerateProps {
  title: string;
  questions: GameQuestion[];
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type Phase = "idle" | "generating-answers" | "done";

export default function StepGenerate({
  title,
  questions,
  onQuestionsChange,
  onNext,
  onBack,
}: StepGenerateProps) {
  const [phase, setPhase] = useState<Phase>(questions.length > 0 ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [searchCount, setSearchCount] = useState(0);
  // Use ref to track latest questions during staggered async updates
  const questionsRef = useRef<GameQuestion[]>(questions);
  questionsRef.current = questions;

  const selectedCount = questions.filter((q) => q.selectedImage).length;
  const allSelected = questions.length >= 10 && selectedCount === questions.length;
  const canDelete = questions.length > 10;

  async function fetchImagesForIndex(
    qs: GameQuestion[],
    idx: number,
    gameTitle: string
  ): Promise<string[]> {
    try {
      const imgRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: gameTitle, answer: qs[idx].answer }),
      });
      setSearchCount((c) => c + 1);
      if (!imgRes.ok) return [];
      const data = await imgRes.json();
      return data.images || [];
    } catch {
      return [];
    }
  }

  async function handleGenerate() {
    setError(null);
    setPhase("generating-answers");

    try {
      // Phase 1: Generate answers via Anthropic
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
      questionsRef.current = newQuestions;
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }

  function handleSelectImage(questionIndex: number, imageUrl: string) {
    const updated = questionsRef.current.map((q, i) =>
      i === questionIndex ? { ...q, selectedImage: imageUrl } : q
    );
    onQuestionsChange(updated);
  }

  function handleDeleteQuestion(questionIndex: number) {
    const updated = questionsRef.current.filter((_, i) => i !== questionIndex);
    onQuestionsChange(updated);
  }

  async function handleExpand(questionIndex: number) {
    const q = questionsRef.current[questionIndex];
    // Only fetch if no images loaded yet and not already loading
    if (q.imageOptions.length > 0 || loadingIndices.has(questionIndex)) return;

    setLoadingIndices((prev) => new Set(prev).add(questionIndex));
    try {
      const images = await fetchImagesForIndex(questionsRef.current, questionIndex, title);
      const updated = questionsRef.current.map((qq, i) =>
        i === questionIndex ? { ...qq, imageOptions: images } : qq
      );
      onQuestionsChange(updated);
      questionsRef.current = updated;
    } catch {
      // silently fail
    } finally {
      setLoadingIndices((prev) => {
        const next = new Set(prev);
        next.delete(questionIndex);
        return next;
      });
    }
  }

  async function handleAnswerChange(questionIndex: number, newAnswer: string) {
    // Update answer text, clear old images
    const updated = questionsRef.current.map((q, i) =>
      i === questionIndex
        ? { ...q, answer: newAnswer, imageOptions: [], selectedImage: "" }
        : q
    );
    onQuestionsChange(updated);
    questionsRef.current = updated;

    // Show loading for this row
    setLoadingIndices((prev) => new Set(prev).add(questionIndex));

    try {
      const imgRes = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, answer: newAnswer }),
      });
      setSearchCount((c) => c + 1);
      if (imgRes.ok) {
        const data = await imgRes.json();
        const withImages = questionsRef.current.map((q, i) =>
          i === questionIndex
            ? { ...q, answer: newAnswer, imageOptions: data.images || [], selectedImage: "" }
            : q
        );
        onQuestionsChange(withImages);
      }
    } catch {
      // Image search failed silently
    } finally {
      setLoadingIndices((prev) => {
        const next = new Set(prev);
        next.delete(questionIndex);
        return next;
      });
    }
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

      {phase === "done" && questions.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">
              {selectedCount}/{questions.length} images selected
            </p>
            <div className="flex items-center gap-4">
              <span className="text-white/20 text-xs">
                {searchCount} searches this session
              </span>
              {phase === "done" && (
                <button
                  onClick={onBack}
                  className="text-white/40 hover:text-white/60 text-sm transition-colors"
                >
                  &larr; Change title
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {questions.map((question, index) => (
              <QuestionRow
                key={index}
                index={index}
                question={question}
                loading={loadingIndices.has(index)}
                onSelectImage={(url) => handleSelectImage(index, url)}
                onAnswerChange={(newAnswer) => handleAnswerChange(index, newAnswer)}
                onDelete={canDelete ? () => handleDeleteQuestion(index) : null}
                onExpand={() => handleExpand(index)}
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
                  : `Select images for all questions (${selectedCount}/${questions.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
