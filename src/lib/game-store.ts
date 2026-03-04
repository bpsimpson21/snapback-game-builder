import { Game, GameMeta, GameQuestion, BuilderDraft } from "@/types/game";

const INDEX_KEY = "snapback-game-index";

// --- Safety utilities ---

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    console.error(`localStorage.setItem failed for key "${key}" (${(value.length / 1024).toFixed(0)}KB)`);
    return false;
  }
}

export function stripBase64FromQuestions(questions: GameQuestion[]): GameQuestion[] {
  return questions.map((q) => {
    const stripped = { ...q };
    if (stripped.selectedImage && stripped.selectedImage.startsWith("data:")) {
      stripped.selectedImage = stripped.originalImageUrl || "";
    }
    if (stripped.imageOptions) {
      stripped.imageOptions = stripped.imageOptions.filter((url) => !url.startsWith("data:"));
    }
    return stripped;
  });
}

// --- Game index ---

export function getGameIndex(): GameMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameMeta[];
  } catch {
    return [];
  }
}

function saveGameIndex(index: GameMeta[]): boolean {
  return safeSetItem(INDEX_KEY, JSON.stringify(index));
}

// --- Game CRUD ---

export function saveGame(game: Game): boolean {
  // Strip any remaining base64 data before saving
  const cleanGame: Game = {
    ...game,
    questions: stripBase64FromQuestions(game.questions),
  };

  const ok = safeSetItem(`game-${game.id}`, JSON.stringify(cleanGame));
  if (!ok) return false;

  // Update index
  const index = getGameIndex();
  const meta: GameMeta = {
    id: game.id,
    title: game.title,
    questionCount: game.questions.length,
    createdAt: game.createdAt,
    playCount: game.playCount,
    categories: game.categories,
    isDraft: game.isDraft,
  };

  const existing = index.findIndex((g) => g.id === game.id);
  if (existing >= 0) {
    index[existing] = meta;
  } else {
    index.unshift(meta); // newest first
  }

  return saveGameIndex(index);
}

export function loadGame(id: string): Game | null {
  try {
    const raw = localStorage.getItem(`game-${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as Game;
  } catch {
    return null;
  }
}

export function incrementPlayCount(id: string): void {
  // Update full game
  const game = loadGame(id);
  if (game) {
    game.playCount = (game.playCount || 0) + 1;
    safeSetItem(`game-${id}`, JSON.stringify(game));
  }

  // Update index
  const index = getGameIndex();
  const entry = index.find((g) => g.id === id);
  if (entry) {
    entry.playCount = (entry.playCount || 0) + 1;
    saveGameIndex(index);
  }
}

export function deleteGame(id: string): void {
  localStorage.removeItem(`game-${id}`);
  const index = getGameIndex().filter((g) => g.id !== id);
  saveGameIndex(index);
}

// --- Draft persistence ---

const DRAFT_KEY = "snapback-builder-draft";

export function saveDraft(draft: BuilderDraft): boolean {
  const cleanDraft: BuilderDraft = {
    ...draft,
    questions: stripBase64FromQuestions(draft.questions),
  };
  return safeSetItem(DRAFT_KEY, JSON.stringify(cleanDraft));
}

export function loadDraft(): BuilderDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BuilderDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// --- Cleanup bloated entries ---

export function cleanupBloatedEntries(): number {
  let cleaned = 0;
  const SIZE_THRESHOLD = 500 * 1024; // 500KB

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith("game-") && key !== DRAFT_KEY) continue;

    const raw = localStorage.getItem(key);
    if (!raw || raw.length < SIZE_THRESHOLD) continue;
    if (!raw.includes('"data:image/')) continue;

    try {
      const parsed = JSON.parse(raw);
      const questions: GameQuestion[] = parsed.questions;
      if (!Array.isArray(questions)) continue;

      parsed.questions = stripBase64FromQuestions(questions);
      safeSetItem(key, JSON.stringify(parsed));
      cleaned++;
    } catch {
      // Skip unparseable entries
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} bloated localStorage entries`);
  }
  return cleaned;
}
