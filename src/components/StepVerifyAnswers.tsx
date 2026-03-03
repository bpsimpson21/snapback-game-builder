"use client";

import { useState, useRef } from "react";
import { GameQuestion } from "@/types/game";
import { generateQuestionId } from "@/lib/id";

interface StepVerifyAnswersProps {
  title: string;
  questions: GameQuestion[];
  onQuestionsChange: (questions: GameQuestion[]) => void;
  onNext: () => void;
  onBack: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

export default function StepVerifyAnswers({
  title,
  questions,
  onQuestionsChange,
  onNext,
  onBack,
  onRegenerate,
  regenerating,
}: StepVerifyAnswersProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const approvedCount = questions.filter((q) => q.approved).length;
  const allApproved = questions.length >= 10 && questions.every((q) => q.approved);

  function handleApprove(index: number) {
    const updated = questions.map((q, i) =>
      i === index ? { ...q, approved: !q.approved } : q
    );
    onQuestionsChange(updated);
  }

  function handleApproveAll() {
    const updated = questions.map((q) => ({ ...q, approved: true }));
    onQuestionsChange(updated);
  }

  function handleRemove(index: number) {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditValue(questions[index].answer);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== questions[editingIndex].answer) {
      const updated = questions.map((q, i) =>
        i === editingIndex
          ? {
              ...q,
              answer: trimmed,
              approved: false,
              imageOptions: [],
              selectedImage: "",
              originalImageUrl: undefined,
              cropData: undefined,
            }
          : q
      );
      onQuestionsChange(updated);
    }
    setEditingIndex(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue("");
  }

  function handleAddManual() {
    const trimmed = newAnswer.trim();
    if (!trimmed) return;
    const q: GameQuestion = {
      id: generateQuestionId(),
      answer: trimmed,
      approved: false,
      imageOptions: [],
      selectedImage: "",
    };
    onQuestionsChange([...questions, q]);
    setNewAnswer("");
  }

  async function handleAiSuggest() {
    setSuggesting(true);
    try {
      const existing = questions.map((q) => q.answer);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, replace: true, existing }),
      });
      if (!res.ok) throw new Error();
      const { answer } = await res.json();
      const q: GameQuestion = {
        id: generateQuestionId(),
        answer,
        approved: false,
        imageOptions: [],
        selectedImage: "",
      };
      onQuestionsChange([...questions, q]);
    } catch {
      // silently fail
    } finally {
      setSuggesting(false);
    }
  }

  // Drag-and-drop
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Verify Answers</h2>
        <p className="text-[#FFD700] font-medium">&ldquo;{title}&rdquo;</p>
        <p className="text-white/40 text-sm mt-1">
          Review the generated answers. Edit, remove, or add before finding images.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 text-sm">
          <span className="text-[#FFD700] font-bold">{approvedCount}</span>/{questions.length} approved
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApproveAll}
            disabled={allApproved}
            className="px-3 py-1.5 border border-[#FFD700]/30 text-[#FFD700] text-sm font-medium rounded-lg hover:bg-[#FFD700]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Approve All
          </button>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="px-3 py-1.5 border border-white/10 text-white/60 text-sm font-medium rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors"
          >
            {regenerating ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                Regenerating...
              </span>
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
      </div>

      {/* Answer list */}
      <div ref={listRef} className="space-y-1.5">
        {questions.map((q, index) => (
          <div
            key={q.id || index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
              dragOverIndex === index && dragIndex !== index
                ? "border-[#FFD700]/50 bg-[#FFD700]/5"
                : q.approved
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-white/10 bg-white/[0.02]"
            } ${dragIndex === index ? "opacity-40" : ""}`}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/40 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.2" />
                <circle cx="11" cy="3" r="1.2" />
                <circle cx="5" cy="8" r="1.2" />
                <circle cx="11" cy="8" r="1.2" />
                <circle cx="5" cy="13" r="1.2" />
                <circle cx="11" cy="13" r="1.2" />
              </svg>
            </div>

            {/* Position number */}
            <span className="text-[#FFD700] font-bold text-sm w-6 text-center shrink-0">
              {index + 1}
            </span>

            {/* Answer text (editable) */}
            {editingIndex === index ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                autoFocus
                className="flex-1 bg-white/10 border border-[#FFD700]/50 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50"
              />
            ) : (
              <button
                onClick={() => startEdit(index)}
                className="flex-1 text-left text-white text-sm font-medium hover:text-[#FFD700] transition-colors truncate"
                title="Click to edit"
              >
                {q.answer}
              </button>
            )}

            {/* Approve button */}
            <button
              onClick={() => handleApprove(index)}
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                q.approved
                  ? "bg-green-500 text-white"
                  : "border border-white/20 text-white/30 hover:border-green-500/50 hover:text-green-400"
              }`}
              title={q.approved ? "Unapprove" : "Approve"}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </button>

            {/* Remove button */}
            <button
              onClick={() => handleRemove(index)}
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-white/10 text-white/30 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Remove"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add answer */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddManual();
          }}
          placeholder="Add an answer..."
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#FFD700]/50"
        />
        <button
          onClick={handleAddManual}
          disabled={!newAnswer.trim()}
          className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
        <button
          onClick={handleAiSuggest}
          disabled={suggesting}
          className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 text-sm font-medium rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
        >
          {suggesting ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
            </span>
          ) : (
            "AI Suggest"
          )}
        </button>
      </div>

      {/* Validation */}
      {!allApproved && questions.length > 0 && (
        <p className="text-white/30 text-xs text-center mt-4">
          {questions.length < 10
            ? `Need at least 10 answers (${questions.length} currently)`
            : `Approve all answers to continue (${approvedCount}/${questions.length} approved)`}
        </p>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          &larr; Back to Title
        </button>
        <button
          onClick={onNext}
          disabled={!allApproved}
          className="px-8 py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Images
        </button>
      </div>
    </div>
  );
}
