"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GameQuestion, CropData } from "@/types/game";
import QuestionRow from "./QuestionRow";
import ImageCropModal from "./ImageCropModal";

interface StepGenerateProps {
  title: string;
  questions: GameQuestion[];
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onNext: () => void;
  onBack: () => void;
}

type Phase = "idle" | "generating-answers" | "fetching-images" | "done";

interface Toast {
  id: number;
  message: string;
}

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
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [searchCount, setSearchCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const toastIdRef = useRef(0);
  const questionsRef = useRef<GameQuestion[]>(questions);
  questionsRef.current = questions;

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropQuestionIndex, setCropQuestionIndex] = useState<number | null>(null);
  const [cropInitialData, setCropInitialData] = useState<CropData | undefined>(undefined);

  const selectedCount = questions.filter((q) => q.selectedImage).length;
  const allSelected = questions.length >= 10 && selectedCount === questions.length;

  function showToast(message: string) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message }]);
  }

  // Auto-dismiss toasts after 3 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

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
      setPhase("fetching-images");
      setProgress(0);

      // Fetch images in parallel batches of 5
      const BATCH_SIZE = 5;
      const allLoading = new Set<number>(newQuestions.map((_, i) => i));
      setLoadingIndices(new Set(allLoading));

      for (let batch = 0; batch < newQuestions.length; batch += BATCH_SIZE) {
        const indices = Array.from(
          { length: Math.min(BATCH_SIZE, newQuestions.length - batch) },
          (_, i) => batch + i
        );

        const results = await Promise.all(
          indices.map(async (idx) => {
            const images = await fetchImagesForIndex(newQuestions, idx, title);
            return { idx, images };
          })
        );

        for (const { idx, images } of results) {
          newQuestions[idx] = { ...newQuestions[idx], imageOptions: images };
          allLoading.delete(idx);
        }

        onQuestionsChange([...newQuestions]);
        questionsRef.current = [...newQuestions];
        setLoadingIndices(new Set(allLoading));
        setProgress(batch + indices.length);
      }

      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }

  function handleSelectImage(questionIndex: number, imageUrl: string) {
    const updated = questionsRef.current.map((q, i) =>
      i === questionIndex
        ? { ...q, selectedImage: imageUrl, originalImageUrl: imageUrl ? q.originalImageUrl : undefined, cropData: imageUrl ? q.cropData : undefined }
        : q
    );
    onQuestionsChange(updated);
  }

  function handleImageClick(questionIndex: number, imageUrl: string) {
    setCropImageUrl(imageUrl);
    setCropQuestionIndex(questionIndex);
    // If re-clicking the same source image, preserve crop data
    const q = questionsRef.current[questionIndex];
    setCropInitialData(q.originalImageUrl === imageUrl ? q.cropData : undefined);
    setCropModalOpen(true);
  }

  function handleRecrop(questionIndex: number) {
    const q = questionsRef.current[questionIndex];
    setCropImageUrl(q.originalImageUrl || q.selectedImage);
    setCropQuestionIndex(questionIndex);
    setCropInitialData(q.cropData);
    setCropModalOpen(true);
  }

  const handleCropSave = useCallback(
    (result: { dataUrl: string }, cropData: CropData) => {
      if (cropQuestionIndex === null || cropImageUrl === null) return;
      const updated = questionsRef.current.map((q, i) =>
        i === cropQuestionIndex
          ? { ...q, selectedImage: result.dataUrl, originalImageUrl: cropImageUrl, cropData }
          : q
      );
      onQuestionsChange(updated);
      setCropModalOpen(false);
      setCropImageUrl(null);
      setCropQuestionIndex(null);
      setCropInitialData(undefined);
    },
    [cropQuestionIndex, cropImageUrl, onQuestionsChange]
  );

  const handleCropCancel = useCallback(() => {
    setCropModalOpen(false);
    setCropImageUrl(null);
    setCropQuestionIndex(null);
    setCropInitialData(undefined);
  }, []);

  async function handleDeleteQuestion(questionIndex: number) {
    const deletedAnswer = questionsRef.current[questionIndex].answer;
    const remaining = questionsRef.current.filter((_, i) => i !== questionIndex);
    onQuestionsChange(remaining);
    questionsRef.current = remaining;

    // Auto-generate a replacement
    try {
      const existingAnswers = remaining.map((q) => q.answer);
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, replace: true, existing: existingAnswers }),
      });

      if (!genRes.ok) throw new Error("Failed to generate replacement");

      const { answer: newAnswer } = await genRes.json();
      const newQuestion: GameQuestion = {
        answer: newAnswer,
        imageOptions: [],
        selectedImage: "",
      };

      const updated = [...questionsRef.current, newQuestion];
      onQuestionsChange(updated);
      questionsRef.current = updated;
      showToast(`Replaced "${deletedAnswer}" with "${newAnswer}"`);
    } catch {
      showToast(`Removed "${deletedAnswer}" — use Add Question to replace`);
    }
  }

  async function handleAddQuestion() {
    setAddingQuestion(true);
    try {
      const existingAnswers = questionsRef.current.map((q) => q.answer);
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, replace: true, existing: existingAnswers }),
      });

      if (!genRes.ok) throw new Error("Failed to generate question");

      const { answer: newAnswer } = await genRes.json();
      const newQuestion: GameQuestion = {
        answer: newAnswer,
        imageOptions: [],
        selectedImage: "",
      };

      const updated = [...questionsRef.current, newQuestion];
      onQuestionsChange(updated);
      questionsRef.current = updated;
      showToast(`Added "${newAnswer}"`);
    } catch {
      showToast("Failed to add question — try again");
    } finally {
      setAddingQuestion(false);
    }
  }

  async function handleExpand(questionIndex: number) {
    const q = questionsRef.current[questionIndex];
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
    const updated = questionsRef.current.map((q, i) =>
      i === questionIndex
        ? { ...q, answer: newAnswer, imageOptions: [], selectedImage: "", originalImageUrl: undefined, cropData: undefined }
        : q
    );
    onQuestionsChange(updated);
    questionsRef.current = updated;

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
            ? { ...q, answer: newAnswer, imageOptions: data.images || [], selectedImage: "", originalImageUrl: undefined, cropData: undefined }
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
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm animate-[fadeIn_0.2s_ease-out]"
          >
            {toast.message}
          </div>
        ))}
      </div>

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
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-red-400 text-sm mb-3">
                Failed to generate questions. This can happen with unusual topics — try again or adjust your game title.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-1.5 bg-red-500/20 text-red-300 text-sm font-medium rounded-md hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
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
        <div className="text-center py-4 mb-4">
          <p className="text-white/60 mb-2">
            Finding images... {progress}/{questions.length}
          </p>
          <div className="w-64 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
              style={{ width: `${(progress / Math.max(questions.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {(phase === "fetching-images" || phase === "done") && questions.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">
              {selectedCount}/{questions.length} images selected
            </p>
            <div className="flex items-center gap-4">
              <span className="text-white/20 text-xs">
                {searchCount} searches this session
              </span>
              <button
                onClick={onBack}
                className="text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                &larr; Change title
              </button>
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
                onImageClick={(url) => handleImageClick(index, url)}
                onRecrop={() => handleRecrop(index)}
                onAnswerChange={(newAnswer) => handleAnswerChange(index, newAnswer)}
                onDelete={() => handleDeleteQuestion(index)}
                onExpand={() => handleExpand(index)}
              />
            ))}
          </div>

          {/* Add Question button — shown when under 20 */}
          {questions.length < 20 && (
            <button
              onClick={handleAddQuestion}
              disabled={addingQuestion}
              className="w-full mt-2 py-3 border border-dashed border-white/20 rounded-lg text-white/40 hover:text-white/60 hover:border-white/40 text-sm font-medium transition-colors disabled:opacity-30"
            >
              {addingQuestion ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                `+ Add Question (${questions.length}/20)`
              )}
            </button>
          )}

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
        </>
      )}

      {/* Crop Modal */}
      {cropModalOpen && cropImageUrl && (
        <ImageCropModal
          imageUrl={cropImageUrl}
          aspectRatio={16 / 9}
          initialCropData={cropInitialData}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
