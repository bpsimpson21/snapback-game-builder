"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Game, GameQuestion, PlayResult } from "@/types/game";
import { fuzzyMatch } from "@/lib/fuzzy-match";
import EndScreen from "./EndScreen";

interface PlayGameProps {
  game: Game;
}

export default function PlayGame({ game }: PlayGameProps) {
  const [queue, setQueue] = useState<GameQuestion[]>(() => [...game.questions]);
  const [results, setResults] = useState<PlayResult[]>([]);
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQuestion = queue[0];
  const answeredCount = results.length;
  const totalQuestions = game.questions.length;

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 100);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  useEffect(() => {
    if (!feedback) {
      inputRef.current?.focus();
    }
  }, [feedback, queue]);

  function advanceToNext(newQueue: GameQuestion[]) {
    if (newQueue.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      return;
    }
    setInput("");
    setFeedback(null);
    startTimer();
  }

  function handleSubmit() {
    if (!currentQuestion || !input.trim() || feedback) return;

    const timeTaken = (Date.now() - startTimeRef.current) / 1000;

    if (fuzzyMatch(input, currentQuestion.answer)) {
      setFeedback("correct");
      const newResults = [...results, { answer: currentQuestion.answer, correct: true, timeTaken }];
      setResults(newResults);

      const newQueue = queue.slice(1);
      setTimeout(() => {
        setQueue(newQueue);
        advanceToNext(newQueue);
      }, 1000);
    } else {
      setFeedback("wrong");
      const newResults = [...results, { answer: currentQuestion.answer, correct: false, timeTaken }];
      setResults(newResults);

      const newQueue = queue.slice(1);
      setTimeout(() => {
        setQueue(newQueue);
        advanceToNext(newQueue);
      }, 1500);
    }
  }

  function handlePass() {
    if (!currentQuestion || feedback) return;

    // Move current question to back of queue
    const newQueue = [...queue.slice(1), currentQuestion];
    setQueue(newQueue);
    advanceToNext(newQueue);
  }

  if (gameOver) {
    return <EndScreen gameTitle={game.title} results={results} />;
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/40 text-sm">
          {answeredCount}/{totalQuestions} answered
        </span>
        <span className="text-white/40 text-sm">
          {queue.length} remaining
        </span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full mb-6">
        <div
          className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Game title */}
      <p className="text-center text-[#FFD700] font-bold text-lg mb-6">
        {game.title}
      </p>

      {/* Image */}
      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 mb-6 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentQuestion.selectedImage}
          alt="Who is this?"
          className="w-full h-full object-cover"
        />
        {/* Timer overlay */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
          <span className="text-white font-mono font-bold text-lg">
            {elapsed.toFixed(1)}s
          </span>
        </div>
        {/* Feedback overlay */}
        {feedback === "correct" && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-pulse">
            <div className="bg-green-500 text-white font-bold text-2xl px-6 py-3 rounded-xl">
              {currentQuestion.answer}
            </div>
          </div>
        )}
        {feedback === "wrong" && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-red-500 text-white font-bold text-xl px-6 py-2 rounded-xl mb-2">
                Wrong!
              </div>
              <div className="bg-black/80 text-white font-medium text-lg px-4 py-2 rounded-lg">
                Answer: {currentQuestion.answer}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={!!feedback}
          placeholder="Type your answer..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-lg focus:outline-none focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || !!feedback}
          className="px-6 py-3 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Submit
        </button>
        <button
          onClick={handlePass}
          disabled={!!feedback}
          className="px-4 py-3 border border-white/10 text-white/60 font-medium rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Pass
        </button>
      </div>

      <p className="text-white/30 text-xs text-center mt-3">
        Press Enter to submit &middot; Pass sends the question to the back of the queue
      </p>
    </div>
  );
}
