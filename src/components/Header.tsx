export default function Header() {
  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FFD700] rounded-sm flex items-center justify-center font-black text-black text-sm">
            S
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Snapback Sports
          </span>
        </div>
        <span className="text-white/40 text-sm">|</span>
        <span className="text-white/60 text-sm font-medium">Game Builder</span>
      </div>
    </header>
  );
}
