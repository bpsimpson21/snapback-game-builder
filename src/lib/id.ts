let counter = 0;

export function generateQuestionId(): string {
  return `q-${Date.now().toString(36)}-${(counter++).toString(36)}`;
}
