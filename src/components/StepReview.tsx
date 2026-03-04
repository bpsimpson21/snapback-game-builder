"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Game, GameQuestion, GAME_CATEGORIES } from "@/types/game";
import { clearDraft, stripBase64FromQuestions } from "@/lib/game-store";
import { uploadGameImages } from "@/lib/image-upload";
import { publishGame } from "@/lib/supabase-games";

interface StepReviewProps {
  title: string;
  questions: GameQuestion[];
  onTitleChange: (title: string) => void;
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  categories: string[];
  onCategoriesChange: (cats: string[]) => void;
  explainerText: string;
  onExplainerTextChange: (text: string) => void;
  samePromptAndResult: boolean;
  onSamePromptAndResultChange: (val: boolean) => void;
  requireExactMatches: boolean;
  onRequireExactMatchesChange: (val: boolean) => void;
}

export default function StepReview({
  title,
  questions,
  onTitleChange,
  onQuestionsChange,
  onBack,
  onSaveDraft,
  categories,
  onCategoriesChange,
  explainerText,
  onExplainerTextChange,
  samePromptAndResult,
  onSamePromptAndResultChange,
  requireExactMatches,
  onRequireExactMatchesChange,
}: StepReviewProps) {
  const router = useRouter();
  const [published, setPublished] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    setUploadProgress(null);

    try {
      // Pre-generate UUID so image folder matches DB ID
      const gameId = crypto.randomUUID();

      // Upload base64 images to Supabase Storage
      const uploadedQuestions = await uploadGameImages(
        gameId,
        questions,
        (progress) => setUploadProgress(progress)
      );

      // Save to Supabase database
      setUploadProgress(null); // Switch to "Saving game..." state
      await publishGame(
        gameId,
        title,
        categories.length > 0 ? categories[0] : null,
        uploadedQuestions.map((q) => ({
          imageUrl: q.selectedImage,
          answer: q.answer,
        }))
      );

      clearDraft();

      const playUrl = `${window.location.origin}/play/${gameId}`;
      navigator.clipboard.writeText(playUrl).catch(() => {});

      setPublished(true);
      setShowConfirm(false);
      setTimeout(() => {
        router.push(`/?published=${gameId}`);
      }, 1500);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish game");
      setPublishing(false);
    }
  }

  function handlePreview() {
    const game: Game = {
      id: "preview",
      title,
      questions,
      createdAt: Date.now(),
      playCount: 0,
    };

    try {
      localStorage.setItem("game-preview", JSON.stringify(game));
    } catch {
      // Quota exceeded — strip base64 and retry
      const stripped: Game = {
        ...game,
        questions: stripBase64FromQuestions(game.questions),
      };
      try {
        localStorage.setItem("game-preview", JSON.stringify(stripped));
      } catch {
        alert("Not enough storage space for preview. Try deleting old games.");
        return;
      }
    }
    window.open("/play/preview", "_blank");
  }

  function handleTitleCommit() {
    const trimmed = titleValue.trim();
    if (trimmed) onTitleChange(trimmed);
    else setTitleValue(title);
    setEditingTitle(false);
  }

  function toggleCategory(cat: string) {
    if (categories.includes(cat)) {
      onCategoriesChange(categories.filter((c) => c !== cat));
    } else {
      onCategoriesChange([...categories, cat]);
    }
  }

  function handleRemoveQuestion(index: number) {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  }

  // Drag-to-reorder
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const updated = [...questions];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dragOverIndex, 0, moved);
      onQuestionsChange(updated);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDraftSave() {
    onSaveDraft();
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Review &amp; Publish</h2>
        <p className="text-white/40 text-sm">{questions.length} questions ready</p>
      </div>

      {/* Game Summary Card */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-6 space-y-4">
        {/* Editable title */}
        <div>
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Game Title</label>
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleCommit();
                if (e.key === "Escape") { setTitleValue(title); setEditingTitle(false); }
              }}
              autoFocus
              className="w-full mt-1 px-3 py-2 bg-white/10 border border-[#FFD700]/50 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50"
            />
          ) : (
            <button
              onClick={() => { setTitleValue(title); setEditingTitle(true); }}
              className="w-full mt-1 text-left text-[#FFD700] text-lg font-bold hover:text-[#FFD700]/80 transition-colors flex items-center gap-2"
            >
              &ldquo;{title}&rdquo;
              <svg className="w-3.5 h-3.5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Categories</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  categories.includes(cat)
                    ? "bg-[#FFD700]/20 border-[#FFD700]/50 text-[#FFD700]"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Explainer text */}
        <div>
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">
            Game Description <span className="text-white/20">(optional)</span>
          </label>
          <textarea
            value={explainerText}
            onChange={(e) => onExplainerTextChange(e.target.value)}
            placeholder="Shown on the game intro screen..."
            rows={2}
            className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FFD700]/50 resize-none"
          />
        </div>
      </div>

      {/* Question Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {questions.map((q, i) => (
          <div
            key={q.id || i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className={`group relative rounded-lg overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
              dragOverIndex === i && dragIndex !== i
                ? "border-[#FFD700]/50 ring-1 ring-[#FFD700]/30"
                : "border-white/10 hover:border-white/20"
            } ${dragIndex === i ? "opacity-40" : ""}`}
          >
            <div className="aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.selectedImage}
                alt={q.answer}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Answer overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
              <span className="text-white text-xs font-medium truncate">{q.answer}</span>
            </div>
            {/* Position badge */}
            <span className="absolute top-1.5 left-1.5 bg-black/70 text-[#FFD700] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {i + 1}
            </span>
            {/* Remove button (hover) */}
            <button
              onClick={() => handleRemoveQuestion(i)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10"
              title="Remove question"
            >
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Advanced Options */}
      <div className="border border-white/10 rounded-xl overflow-hidden mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
        >
          <span className="text-white/60 text-sm font-medium">Advanced Options</span>
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAdvanced && (
          <div className="px-5 pb-4 space-y-3 border-t border-white/5">
            <label className="flex items-center gap-3 pt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={samePromptAndResult}
                onChange={(e) => onSamePromptAndResultChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FFD700] focus:ring-[#FFD700]/50"
              />
              <div>
                <p className="text-white text-sm">Same prompt and result image</p>
                <p className="text-white/30 text-xs">The image shown in the prompt is the same on the result screen.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireExactMatches}
                onChange={(e) => onRequireExactMatchesChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#FFD700] focus:ring-[#FFD700]/50"
              />
              <div>
                <p className="text-white text-sm">Require exact matches</p>
                <p className="text-white/30 text-xs">Players must type the exact answer (no fuzzy matching).</p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors text-sm"
        >
          &larr; Back to Images
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDraftSave}
            className="px-5 py-2.5 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors text-sm"
          >
            {draftSaved ? "Draft Saved!" : "Save as Draft"}
          </button>
          <button
            onClick={handlePreview}
            className="px-5 py-2.5 border border-[#FFD700]/30 text-[#FFD700] font-medium rounded-lg hover:bg-[#FFD700]/10 transition-colors text-sm"
          >
            Preview
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-6 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 transition-colors text-sm"
          >
            Publish Game
          </button>
        </div>
      </div>

      <p className="text-white/30 text-xs text-center mt-4">
        Drag cards to reorder questions by difficulty. Publishing saves to your library and copies the play link.
      </p>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => { if (!publishing) setShowConfirm(false); }}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-lg mb-2">Publish Game?</h3>
            <p className="text-white/60 text-sm mb-6">
              Publish &ldquo;{title}&rdquo; with {questions.length} questions? The play link will be copied to your clipboard.
            </p>

            {/* Upload progress */}
            {publishing && uploadProgress && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                  <span>Uploading images...</span>
                  <span>{uploadProgress.done}/{uploadProgress.total}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {publishing && !uploadProgress && (
              <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                Saving game...
              </div>
            )}

            {/* Error message */}
            {publishError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{publishError}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={publishing}
                className="px-5 py-2 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing
                  ? uploadProgress
                    ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                    : "Saving..."
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
