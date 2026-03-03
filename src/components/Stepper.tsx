interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { num: 1, label: "Title" },
  { num: 2, label: "Answers" },
  { num: 3, label: "Images" },
  { num: 4, label: "Review" },
];

export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, i) => {
        const isCompleted = currentStep > step.num;
        const isActive = currentStep === step.num;
        const isFuture = currentStep < step.num;
        const canClick = isCompleted && onStepClick;

        const circle = (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              isActive
                ? "bg-[#FFD700] text-black ring-2 ring-[#FFD700]/30"
                : isCompleted
                  ? "bg-[#FFD700] text-black"
                  : "bg-white/10 text-white/40"
            }`}
          >
            {isCompleted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step.num
            )}
          </div>
        );

        const label = (
          <span
            className={`text-sm font-medium transition-colors ${
              isFuture ? "text-white/40" : "text-white"
            }`}
          >
            {step.label}
          </span>
        );

        return (
          <div key={step.num} className="flex items-center gap-2">
            {canClick ? (
              <button
                onClick={() => onStepClick(step.num)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                {circle}
                {label}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {circle}
                {label}
              </div>
            )}
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-colors ${
                  currentStep > step.num ? "bg-[#FFD700]" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
