"use client";

import { useState, useEffect, useCallback } from "react";
import { GameQuestion } from "@/types/game";
import { generateQuestionId } from "@/lib/id";
import { saveDraft, loadDraft } from "@/lib/game-store";
import Header from "@/components/Header";
import Stepper from "@/components/Stepper";
import StepTitle from "@/components/StepTitle";
import StepVerifyAnswers from "@/components/StepVerifyAnswers";
import StepPickImages from "@/components/StepPickImages";
import StepReview from "@/components/StepReview";

export default function BuilderPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Step 4 state
  const [categories, setCategories] = useState<string[]>([]);
  const [explainerText, setExplainerText] = useState("");
  const [samePromptAndResult, setSamePromptAndResult] = useState(true);
  const [requireExactMatches, setRequireExactMatches] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.title) {
      setStep(draft.step);
      setTitle(draft.title);
      setQuestions(draft.questions);
      setCategories(draft.categories);
      setExplainerText(draft.explainerText);
      setSamePromptAndResult(draft.samePromptAndResult);
      setRequireExactMatches(draft.requireExactMatches);
    }
  }, []);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (step === 1 && !title) return;
    const timer = setTimeout(() => {
      saveDraft({
        step,
        title,
        questions,
        categories,
        explainerText,
        samePromptAndResult,
        requireExactMatches,
        savedAt: Date.now(),
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, title, questions, categories, explainerText, samePromptAndResult, requireExactMatches]);

  // Browser back button
  useEffect(() => {
    window.history.replaceState({ step }, "", "/builder");
  }, [step]);

  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const prevStep = e.state?.step;
      if (typeof prevStep === "number" && prevStep >= 1 && prevStep <= 4) {
        setStep(prevStep);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Shared generation logic (used by StepTitle and StepVerifyAnswers "Regenerate")
  const handleGenerate = useCallback(async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate answers");
      }
      const { answers } = await res.json();
      const newQuestions: GameQuestion[] = answers.map((answer: string) => ({
        id: generateQuestionId(),
        answer,
        approved: false,
        imageOptions: [],
        selectedImage: "",
      }));
      setQuestions(newQuestions);
      setStep(2);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }, [title]);

  function handleStepperClick(targetStep: number) {
    if (targetStep < step) {
      setStep(targetStep);
    }
  }

  function handleSaveDraft() {
    saveDraft({
      step,
      title,
      questions,
      categories,
      explainerText,
      samePromptAndResult,
      requireExactMatches,
      savedAt: Date.now(),
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-4">
        <Stepper currentStep={step} onStepClick={handleStepperClick} />

        <div className="mt-4">
          {step === 1 && (
            <StepTitle
              title={title}
              onTitleChange={setTitle}
              onGenerate={handleGenerate}
              generating={generating}
              error={genError}
            />
          )}

          {step === 2 && (
            <StepVerifyAnswers
              title={title}
              questions={questions}
              onQuestionsChange={setQuestions}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              onRegenerate={handleGenerate}
              regenerating={generating}
            />
          )}

          {step === 3 && (
            <StepPickImages
              title={title}
              questions={questions}
              onQuestionsChange={setQuestions}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && (
            <StepReview
              title={title}
              questions={questions}
              onTitleChange={setTitle}
              onQuestionsChange={setQuestions}
              onBack={() => setStep(3)}
              onSaveDraft={handleSaveDraft}
              categories={categories}
              onCategoriesChange={setCategories}
              explainerText={explainerText}
              onExplainerTextChange={setExplainerText}
              samePromptAndResult={samePromptAndResult}
              onSamePromptAndResultChange={setSamePromptAndResult}
              requireExactMatches={requireExactMatches}
              onRequireExactMatchesChange={setRequireExactMatches}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 text-center">
        <p className="text-white/20 text-xs">
          Snapback Sports &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
