function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, "") // strip punctuation
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function fuzzyMatch(userInput: string, correctAnswer: string): boolean {
  const input = normalize(userInput);
  const answer = normalize(correctAnswer);

  if (!input) return false;

  // Exact match
  if (input === answer) return true;

  // Check if input matches last name (last word of answer)
  const answerParts = answer.split(/\s+/);
  const lastName = answerParts[answerParts.length - 1];
  if (answerParts.length > 1 && input === lastName) return true;

  // Check if input matches first name
  const firstName = answerParts[0];
  if (answerParts.length > 1 && input === firstName) return true;

  // Check substring containment (answer contains input or vice versa)
  if (answer.includes(input) && input.length >= 3) return true;
  if (input.includes(answer)) return true;

  // Levenshtein distance - allow 1 typo for short names, 2 for longer
  const threshold = answer.length <= 5 ? 1 : 2;
  if (levenshtein(input, answer) <= threshold) return true;

  // Check levenshtein against last name too
  if (answerParts.length > 1) {
    const lastNameThreshold = lastName.length <= 5 ? 1 : 2;
    if (levenshtein(input, lastName) <= lastNameThreshold) return true;
  }

  return false;
}
