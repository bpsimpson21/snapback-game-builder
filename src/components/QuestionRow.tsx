"use client";

import { useState } from "react";
import { GameQuestion } from "@/types/game";

interface QuestionRowProps {
  index: number;
  question: GameQuestion;
  onSelectImage: (imageUrl: string) => void;
}

export default function QuestionRow({ index, question, onSelectImage }: QuestionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-[#FFD700] font-bold text-sm w-6 shrink-0">
          {index + 1}
        </span>
        <span className="text-white font-medium flex-1">{question.answer}</span>
        {question.selectedImage ? (
          <span className="text-green-400 text-xs font-medium px-2 py-0.5 bg-green-400/10 rounded-full">
            Image selected
          </span>
        ) : (
          <span className="text-white/40 text-xs font-medium px-2 py-0.5 bg-white/5 rounded-full">
            Pick an image
          </span>
        )}
        <svg
          className={`w-4 h-4 text-white/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          {question.imageOptions.length === 0 ? (
            <p className="text-white/40 text-sm py-4 text-center">
              No images found
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
