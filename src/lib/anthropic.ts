import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateAnswers(gameTitle: string): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a sports trivia expert. For a trivia game titled "${gameTitle}", generate exactly 20 correct answers.

For example:
- "Name That 2010s Redskin" → 20 notable Washington Redskins players from the 2010s
- "Name That 90s Bull" → 20 notable Chicago Bulls players from the 1990s
- "Name That 2000s Yankee" → 20 notable New York Yankees players from the 2000s

Rules:
- Return exactly 20 answers
- Each answer should be a person's full name (first and last)
- Choose well-known, recognizable people that a sports fan would know
- Order them from most to least well-known
- Return ONLY a JSON array of strings, no other text

Example response format:
["Player One", "Player Two", "Player Three", ...]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  const parsed = JSON.parse(content.text);
  if (!Array.isArray(parsed) || parsed.length !== 20) {
    throw new Error("Expected exactly 20 answers from Anthropic");
  }

  return parsed;
}
