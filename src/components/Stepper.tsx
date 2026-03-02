interface StepperProps {
  currentStep: number;
}

const steps = [
  { num: 1, label: "Title" },
  { num: 2, label: "Generate" },
  { num: 3, label: "Review" },
];

export default function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              currentStep >= step.num
                ? "bg-[#FFD700] text-black"
                : "bg-white/10 text-white/40"
            }`}
          >
            {step.num}
          </div>
          <span
            className={`text-sm font-medium transition-colors ${
              currentStep >= step.num ? "text-white" : "text-white/40"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 transition-colors ${
                currentStep > step.num ? "bg-[#FFD700]" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
