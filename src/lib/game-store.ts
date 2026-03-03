import { Game, GameMeta, BuilderDraft } from "@/types/game";

const INDEX_KEY = "snapback-game-index";

export function getGameIndex(): GameMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameMeta[];
  } catch {
    return [];
  }
}

function saveGameIndex(index: GameMeta[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function saveGame(game: Game): void {
  // Store full game data
  localStorage.setItem(`game-${game.id}`, JSON.stringify(game));

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

  saveGameIndex(index);
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
    localStorage.setItem(`game-${id}`, JSON.stringify(game));
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

// Draft persistence
const DRAFT_KEY = "snapback-builder-draft";

export function saveDraft(draft: BuilderDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
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
