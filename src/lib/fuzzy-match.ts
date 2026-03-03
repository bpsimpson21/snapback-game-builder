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

// Common sports nickname mappings
const NICKNAMES: Record<string, string[]> = {
  "robert griffin iii": ["rg3", "rgiii", "griffin"],
  "desean jackson": ["djax", "djack"],
  "michael jordan": ["mj", "air jordan"],
  "lebron james": ["bron", "lbj", "king james"],
  "shaquille oneal": ["shaq"],
  "charles barkley": ["sir charles", "chuck"],
  "patrick mahomes": ["mahomes"],
  "tom brady": ["tb12", "brady"],
  "aaron rodgers": ["arod", "a rod"],
  "stephen curry": ["steph", "steph curry"],
  "kevin durant": ["kd"],
  "allen iverson": ["ai", "the answer"],
  "dwyane wade": ["d wade", "dwade"],
  "chris paul": ["cp3"],
  "carmelo anthony": ["melo"],
  "russell westbrook": ["russ", "westbrook"],
  "anthony davis": ["ad"],
  "derrick rose": ["d rose", "drose"],
};

export function fuzzyMatch(userInput: string, correctAnswer: string): boolean {
  const input = normalize(userInput);
  const answer = normalize(correctAnswer);

  if (!input) return false;

  // 1. Exact match (case-insensitive, normalized)
  if (input === answer) return true;

  const answerWords = answer.split(/\s+/);

  // 2. Any individual word in the answer matches exactly
  if (answerWords.some((word) => word === input)) return true;

  // 3. Last name matches (last word)
  const lastName = answerWords[answerWords.length - 1];
  if (answerWords.length > 1 && input === lastName) return true;

  // 4. Levenshtein distance ratio < 0.3 (~30% typo tolerance)
  const dist = levenshtein(input, answer);
  const maxLen = Math.max(input.length, answer.length);
  if (maxLen > 0 && dist / maxLen < 0.3) return true;

  // Also check Levenshtein against last name
  if (answerWords.length > 1) {
    const lastDist = levenshtein(input, lastName);
    const lastMax = Math.max(input.length, lastName.length);
    if (lastMax > 0 && lastDist / lastMax < 0.3) return true;
  }

  // 5. Nickname / abbreviation lookup
  const nicknames = NICKNAMES[answer];
  if (nicknames && nicknames.some((nick) => normalize(nick) === input)) return true;

  return false;
}
