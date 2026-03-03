"use client";

import { useState, useRef } from "react";
import { GameQuestion } from "@/types/game";

interface QuestionRowProps {
  index: number;
  question: GameQuestion;
  onSelectImage: (imageUrl: string) => void;
  onAnswerChange: (newAnswer: string) => void;
}

export default function QuestionRow({ index, question, onSelectImage, onAnswerChange }: QuestionRowProps) {
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
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSelectImage(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
        <span className="text-[#FFD700] font-bold text-sm w-6 shrink-0">
          {index + 1}
        </span>

        {/* Editable answer */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setEditValue(question.answer);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="flex-1 bg-white/10 border border-[#FFD700]/50 rounded px-2 py-0.5 text-white font-medium text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="flex-1 text-left text-white font-medium hover:text-[#FFD700] transition-colors group flex items-center gap-1.5"
            title="Click to edit answer"
          >
            {question.answer}
            <svg className="w-3 h-3 text-white/20 group-hover:text-[#FFD700]/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {question.selectedImage ? (
          <span className="text-green-400 text-xs font-medium px-2 py-0.5 bg-green-400/10 rounded-full shrink-0">
            Image selected
          </span>
        ) : (
          <span className="text-white/40 text-xs font-medium px-2 py-0.5 bg-white/5 rounded-full shrink-0">
            Pick an image
          </span>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            {/* Google image results */}
            {question.imageOptions.map((url, imgIndex) => (
              <button
                key={imgIndex}
                onClick={() => onSelectImage(url)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                  question.selectedImage === url
                    ? "border-[#FFD700] ring-2 ring-[#FFD700]/30"
                    : "border-transparent hover:border-white/20"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Option ${imgIndex + 1} for ${question.answer}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                {question.selectedImage === url && (
                  <div className="absolute inset-0 bg-[#FFD700]/20 flex items-center justify-center">
                    <div className="bg-[#FFD700] rounded-full p-1">
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}

            {/* Upload own image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-square rounded-lg border-2 border-dashed transition-all hover:scale-[1.02] flex flex-col items-center justify-center gap-2 ${
                question.selectedImage && question.selectedImage.startsWith("data:")
                  ? "border-[#FFD700] ring-2 ring-[#FFD700]/30 bg-[#FFD700]/5"
                  : "border-white/20 hover:border-white/40 bg-white/5"
              }`}
            >
              {question.selectedImage && question.selectedImage.startsWith("data:") ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.selectedImage}
                    alt="Uploaded image"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-[#FFD700]/20 flex items-center justify-center">
                    <div className="bg-[#FFD700] rounded-full p-1">
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/40 text-xs font-medium">Upload</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {question.imageOptions.length === 0 && (
            <p className="text-white/30 text-xs text-center mt-2">
              No search results found — try editing the answer or uploading an image
            </p>
          )}
        </div>
      )}
    </div>
  );
}
