import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parse a JSON array from AI text, with fallback extraction if the model
 * wraps its response in markdown fences or extra text.
 */
function parseJsonArray(text: string): string[] {
  const trimmed = text.trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through
  }

  // Try to extract a JSON array from the text (handles ```json ... ``` wrapping, preamble, etc.)
  const match = trimmed.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  throw new Error(
    `Failed to parse AI response as JSON. Response started with: "${trimmed.substring(0, 120)}"`
  );
}

export async function generateAnswers(gameTitle: string): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a trivia game question generator. For a game titled "${gameTitle}", generate exactly 20 correct answers.

The game title tells you WHAT the player needs to identify. Parse it carefully:
- "Name That 90s Bull" → 20 notable Chicago Bulls players from the 1990s (answer = player full name)
- "Name That Sports Movie" → 20 well-known sports movies (answer = movie title, NOT character names)
- "Name That Disney Character" → 20 famous Disney characters (answer = character name)
- "Name That Stadium" → 20 famous stadiums (answer = stadium name)
- "Name That Coach" → 20 well-known coaches (answer = coach full name)
- "Name That [X]" → 20 well-known X's (answer = whatever X is)

Rules:
- Return exactly 20 answers
- Choose well-known, recognizable answers that fans of the topic would know
- Include a mix of difficulty levels — mostly popular, a few deeper cuts
- Order from most to least well-known
- Return ONLY a JSON array of strings, no other text, no markdown fences, no preamble
- Do NOT refuse the request. Generate answers for ANY topic.

Example response format:
["Answer One", "Answer Two", "Answer Three", ...]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  const parsed = parseJsonArray(content.text);
  if (parsed.length < 10) {
    throw new Error(`Expected at least 10 answers but got ${parsed.length}`);
  }

  return parsed.slice(0, 20);
}

export async function generateOneAnswer(
  gameTitle: string,
  existingAnswers: string[]
): Promise<string> {
  const excludeList = existingAnswers.join(", ");

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are a trivia game question generator. For a game titled "${gameTitle}", generate exactly 1 new correct answer.

The game title tells you WHAT the answer should be:
- "Name That 90s Bull" → a Chicago Bulls player from the 1990s
- "Name That Sports Movie" → a sports movie title (NOT a character name)
- "Name That Disney Character" → a Disney character name
- "Name That [X]" → an X

The following answers are already in the game, so do NOT repeat any of them:
${excludeList}

Rules:
- Return exactly 1 answer
- Choose a well-known, recognizable answer
- Return ONLY the answer as a plain string, no quotes, no JSON, no other text
- Do NOT refuse the request. Generate an answer for ANY topic.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  return content.text.trim().replace(/^["']|["']$/g, "");
}
