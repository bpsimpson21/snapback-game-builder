import { GameQuestion, BuilderDraft } from "@/types/game";

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
