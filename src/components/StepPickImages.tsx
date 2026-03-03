"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { GameQuestion, CropData } from "@/types/game";
import QuestionRow from "./QuestionRow";
import ImageCropModal from "./ImageCropModal";

interface StepPickImagesProps {
  title: string;
  questions: GameQuestion[];
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Toast {
  id: number;
  message: string;
}

export default function StepPickImages({
  title,
  questions,
  onQuestionsChange,
  onNext,
  onBack,
}: StepPickImagesProps) {
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [searchCount, setSearchCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const questionsRef = useRef<GameQuestion[]>(questions);
  questionsRef.current = questions;
  const fetchedRef = useRef(false);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropQuestionIndex, setCropQuestionIndex] = useState<number | null>(null);
  const [cropInitialData, setCropInitialData] = useState<CropData | undefined>(undefined);

  const selectedCount = questions.filter((q) => q.selectedImage).length;
  const allSelected = questions.length > 0 && selectedCount === questions.length;

  function showToast(message: string) {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message }]);
  }

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Fetch images for a single question
  async function fetchImagesForIndex(
    qs: GameQuestion[],
    idx: number,
    gameTitle: string
  ): Promise<string[]> {
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: gameTitle, answer: qs[idx].answer }),
      });
      setSearchCount((c) => c + 1);
      if (!res.ok) return [];
      const data = await res.json();
      return data.images || [];
    } catch {
      return [];
    }
  }

  // On mount: batch-fetch images for questions that need them (smart re-search)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const needsImages: number[] = [];
    questions.forEach((q, i) => {
      if (q.approved && q.imageOptions.length === 0) {
        needsImages.push(i);
      }
    });

    if (needsImages.length === 0) return;

    setFetching(true);
    setProgress(0);

    const allLoading = new Set<number>(needsImages);
    setLoadingIndices(new Set(allLoading));

    (async () => {
      const BATCH_SIZE = 5;
      const current = [...questionsRef.current];

      for (let batch = 0; batch < needsImages.length; batch += BATCH_SIZE) {
        const indices = needsImages.slice(batch, batch + BATCH_SIZE);

        const results = await Promise.all(
          indices.map(async (idx) => {
            const images = await fetchImagesForIndex(current, idx, title);
            return { idx, images };
          })
        );

        for (const { idx, images } of results) {
          current[idx] = { ...current[idx], imageOptions: images };
          allLoading.delete(idx);
        }

        onQuestionsChange([...current]);
        questionsRef.current = [...current];
        setLoadingIndices(new Set(allLoading));
        setProgress(Math.min(batch + indices.length, needsImages.length));
      }

      setFetching(false);
      showToast(`Found images for ${needsImages.length} answers`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Image selection handlers
  function handleSelectImage(questionIndex: number, imageUrl: string) {
    const updated = questionsRef.current.map((q, i) =>
      i === questionIndex
        ? {
            ...q,
            selectedImage: imageUrl,
            originalImageUrl: imageUrl ? q.originalImageUrl : undefined,
            cropData: imageUrl ? q.cropData : undefined,
          }
        : q
    );
    onQuestionsChange(updated);
  }

  function handleImageClick(questionIndex: number, imageUrl: string) {
    setCropImageUrl(imageUrl);
    setCropQuestionIndex(questionIndex);
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

  // Expand handler: lazy-load images for a question if not already loaded
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

  const totalNeedImages = questions.filter((q) => q.approved && q.imageOptions.length === 0).length;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toasts */}
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
        <h2 className="text-3xl font-bold text-white mb-2">Pick Images</h2>
        <p className="text-[#FFD700] font-medium">&ldquo;{title}&rdquo;</p>
      </div>

      {/* Progress bar during initial fetch */}
      {fetching && (
        <div className="text-center py-4 mb-4">
          <p className="text-white/60 mb-2">
            Finding images... {progress}/{totalNeedImages + progress}
          </p>
          <div className="w-64 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
              style={{
                width: `${(progress / Math.max(totalNeedImages + progress, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats bar */}
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
            &larr; Back to Answers
          </button>
        </div>
      </div>

      {/* Question rows — read only answers, image selection only */}
      <div className="space-y-2">
        {questions.map((question, index) => (
          <QuestionRow
            key={question.id || index}
            index={index}
            question={question}
            loading={loadingIndices.has(index)}
            readOnly
            onSelectImage={(url) => handleSelectImage(index, url)}
            onImageClick={(url) => handleImageClick(index, url)}
            onRecrop={() => handleRecrop(index)}
            onAnswerChange={() => {}}
            onDelete={null}
            onExpand={() => handleExpand(index)}
          />
        ))}
      </div>

      {/* Continue */}
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
