"use client";

interface StepTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  onNext: () => void;
}

const EXAMPLE_TITLES = [
  "Name That 2010s Redskin",
  "Name That 90s Bull",
  "Name That 2000s Yankee",
  "Name That 80s Laker",
  "Name That 2010s Warrior",
  "Name That 2000s Patriot",
];

export default function StepTitle({ title, onTitleChange, onNext }: StepTitleProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Create Your Game
        </h2>
        <p className="text-white/60">
          Enter a &quot;Name That X&quot; title to get started
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) onNext();
          }}
          placeholder="e.g., Name That 2010s Redskin"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-lg focus:outline-none focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/50 transition-colors"
        />

        <button
          onClick={onNext}
          disabled={!title.trim()}
          className="w-full py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>

      <div className="mt-8">
        <p className="text-white/40 text-sm mb-3 text-center">
          Or try an example:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLE_TITLES.map((example) => (
            <button
              key={example}
              onClick={() => onTitleChange(example)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
