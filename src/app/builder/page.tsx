"use client";

import { useState } from "react";
import { GameQuestion } from "@/types/game";
import Header from "@/components/Header";
import Stepper from "@/components/Stepper";
import StepTitle from "@/components/StepTitle";
import StepGenerate from "@/components/StepGenerate";
import StepReview from "@/components/StepReview";

export default function BuilderPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-4">
        <Stepper currentStep={step} />

        <div className="mt-4">
          {step === 1 && (
            <StepTitle
              title={title}
              onTitleChange={setTitle}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepGenerate
              title={title}
              questions={questions}
              onQuestionsChange={setQuestions}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepReview
              title={title}
              questions={questions}
              onBack={() => setStep(2)}
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
