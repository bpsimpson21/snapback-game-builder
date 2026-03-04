"use client";

import { useState, useRef, useCallback } from "react";
import { GameQuestion } from "@/types/game";

function proxyUrl(url: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("/api/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

interface QuestionRowProps {
  index: number;
  question: GameQuestion;
  loading?: boolean;
  readOnly?: boolean;
  onSelectImage: (imageUrl: string) => void;
  onImageClick: (imageUrl: string) => void;
  onRecrop: () => void;
  onAnswerChange: (newAnswer: string) => void;
  onDelete: (() => void) | null;
  onExpand?: () => void;
}

export default function QuestionRow({ index, question, loading, readOnly, onSelectImage, onImageClick, onRecrop, onAnswerChange, onDelete, onExpand }: QuestionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editValue, setEditValue] = useState(question.answer);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== question.answer) {
      onAnswerChange(trimmed);
    } else {
      setEditValue(question.answer);
    }
    setIsEditing(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageClick(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const hasImages = question.imageOptions.length > 0;
  const hasCroppedImage = !!question.selectedImage;
  // Which source URL was used (to highlight in the grid)
  const sourceUrl = question.originalImageUrl || "";

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
        <span className="text-[#FFD700] font-bold text-sm w-6 shrink-0">
          {index + 1}
        </span>

        {/* Answer text */}
        {readOnly ? (
          <span className="flex-1 text-white font-medium text-sm truncate">
            {question.answer}
          </span>
        ) : isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setEditValue(question.answer); setIsEditing(false); }
            }}
            autoFocus
            className="flex-1 bg-white/10 border border-[#FFD700]/50 rounded px-2 py-0.5 text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="flex-1 text-left text-white font-medium hover:text-[#FFD700] transition-colors group flex items-center gap-1.5"
            title="Click to edit answer"
          >
            {question.answer}
            <svg className="w-3 h-3 text-white/20 group-hover:text-[#FFD700]/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {/* Status badge */}
        {loading ? (
          <span className="shrink-0 flex items-center gap-1.5 text-[#FFD700]/60 text-xs font-medium px-2 py-0.5 bg-[#FFD700]/5 rounded-full">
            <span className="inline-block w-3 h-3 border border-[#FFD700]/60 border-t-transparent rounded-full animate-spin" />
            Searching
          </span>
        ) : hasCroppedImage ? (
          <span className="text-green-400 text-xs font-medium px-2 py-0.5 bg-green-400/10 rounded-full shrink-0">
            Image selected
          </span>
        ) : (
          <span className="text-white/40 text-xs font-medium px-2 py-0.5 bg-white/5 rounded-full shrink-0">
            {hasImages ? "Pick an image" : "No images"}
          </span>
        )}

        <button onClick={() => { if (!expanded) onExpand?.(); setExpanded(!expanded); }} className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors">
          <svg className={`w-4 h-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {!readOnly && (
          <button
            onClick={onDelete ?? undefined}
            disabled={!onDelete}
            title={onDelete ? "Remove this answer" : "Minimum 10 answers required"}
            className="shrink-0 p-1 hover:bg-red-500/10 rounded transition-colors disabled:opacity-20 disabled:cursor-not-allowed group/del"
          >
            <svg className="w-4 h-4 text-white/30 group-hover/del:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <span className="inline-block w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-white/40 text-sm">Searching for images...</span>
            </div>
          ) : (
            <>
              {/* Cropped image preview */}
              {hasCroppedImage && (
                <div className="pt-3 mb-3">
                  <div className="relative group/crop rounded-lg overflow-hidden border-2 border-green-500/40 cursor-pointer" onClick={onRecrop}>
                    <div className="aspect-video">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={question.selectedImage}
                        alt={`Cropped image for ${question.answer}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/crop:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                      <span className="text-white text-sm font-medium">Re-crop</span>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectImage(""); }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors z-10"
                      title="Remove selected image"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-white/30 text-xs mt-1.5 text-center">
                    Click to re-crop &middot; Or pick a different image below
                  </p>
                </div>
              )}

              {/* Image options grid */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                {question.imageOptions.map((url, imgIndex) => (
                  <ThumbnailOption
                    key={imgIndex}
                    url={url}
                    imgIndex={imgIndex}
                    answer={question.answer}
                    isSelected={sourceUrl === url}
                    onImageClick={onImageClick}
                  />
                ))}

                {/* Upload own image */}
                <div className="relative">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg border-2 border-dashed transition-all hover:scale-[1.01] flex flex-col items-center justify-center gap-2 border-white/20 hover:border-white/40 bg-white/5"
                  >
                    <div className="aspect-video w-full flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                      <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white/40 text-xs font-medium">Upload</span>
                    </div>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
              </div>

              {!hasImages && !loading && (
                <p className="text-white/30 text-xs text-center mt-2">
                  No search results found — try editing the answer or uploading an image
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Separate component so each thumbnail manages its own error/retry state
function ThumbnailOption({
  url,
  imgIndex,
  answer,
  isSelected,
  onImageClick,
}: {
  url: string;
  imgIndex: number;
  answer: string;
  isSelected: boolean;
  onImageClick: (url: string) => void;
}) {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFailed(false);
    setRetryKey((k) => k + 1);
  }, []);

  if (failed) {
    return (
      <div className="relative">
        <button
          onClick={handleRetry}
          className="relative w-full rounded-lg overflow-hidden border-2 border-transparent hover:border-white/20 transition-all"
        >
          <div className="aspect-video bg-white/5 flex flex-col items-center justify-center gap-1.5">
            <svg className="w-5 h-5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-white/30 text-[10px] font-medium">Retry</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => onImageClick(url)}
        className={`relative w-full rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.01] ${
          isSelected
            ? "border-[#FFD700] ring-2 ring-[#FFD700]/30"
            : "border-transparent hover:border-white/20"
        }`}
      >
        <div className="aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={retryKey}
            src={proxyUrl(url)}
            alt={`Option ${imgIndex + 1} for ${answer}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-[#FFD700]/20 flex items-center justify-center">
            <div className="bg-[#FFD700] rounded-full p-1">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
