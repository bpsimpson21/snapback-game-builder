"use client";

interface StepTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}

const EXAMPLE_TITLES = [
  "Name That 2010s Redskin",
  "Name That 90s Bull",
  "Name That 2000s Yankee",
  "Name That 80s Laker",
  "Name That 2010s Warrior",
  "Name That 2000s Patriot",
];

export default function StepTitle({ title, onTitleChange, onGenerate, generating, error }: StepTitleProps) {
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
            if (e.key === "Enter" && title.trim() && !generating) onGenerate();
          }}
          placeholder="e.g., Name That 2010s Redskin"
          disabled={generating}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-lg focus:outline-none focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/50 disabled:opacity-50 transition-colors"
        />

        <button
          onClick={onGenerate}
          disabled={!title.trim() || generating}
          className="w-full py-3 bg-[#FFD700] text-black font-bold rounded-lg text-lg hover:bg-[#FFD700]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            "Generate 20 Questions"
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm mb-3">
            Failed to generate questions. This can happen with unusual topics — try again or adjust your game title.
          </p>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="px-4 py-1.5 bg-red-500/20 text-red-300 text-sm font-medium rounded-md hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-8">
        <p className="text-white/40 text-sm mb-3 text-center">
          Or try an example:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {EXAMPLE_TITLES.map((example) => (
            <button
              key={example}
              onClick={() => onTitleChange(example)}
              disabled={generating}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4 text-center">
          How It Works
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-white text-sm font-medium">Enter a game title</p>
              <p className="text-white/40 text-xs mt-0.5">
                The more specific, the better. &ldquo;Name That 90s Bull&rdquo; gives you Jordan, Pippen, Rodman.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-white text-sm font-medium">Verify &amp; approve answers</p>
              <p className="text-white/40 text-xs mt-0.5">
                Review the AI&apos;s answers. Edit, remove, or add your own before searching for images.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-white text-sm font-medium">Pick the best image</p>
              <p className="text-white/40 text-xs mt-0.5">
                Google Image Search finds photos for each answer. Crop and select the best one.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-bold flex items-center justify-center">
              4
            </span>
            <div>
              <p className="text-white text-sm font-medium">Review &amp; publish</p>
              <p className="text-white/40 text-xs mt-0.5">
                Customize settings, reorder questions, then publish your game.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
