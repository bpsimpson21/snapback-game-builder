# CLAUDE.md — Snapback Sports AI Game Builder

## PROJECT
Snapback Sports AI Game Builder — "Name That X" trivia game creator.
Demo for Snapback Sports CEO Jack Settlemen showing how AI can automate trivia game creation.

## TECH STACK
- Next.js 15 (App Router) with TypeScript and Tailwind CSS v4
- Anthropic API for generating game answers
- SerpAPI (Google Images) for finding images
- No database — game state stored in localStorage
- Deployed on Vercel

## BRAND
- Colors: Yellow (#FFD700), Black (#0A0A0A), White (#F5F5F5)
- Dark theme throughout
- Sports media energy, clean and professional
- Match Snapback's existing app aesthetic

## KEY ARCHITECTURE
- `/api/generate` — calls Anthropic API, takes a game title, returns 20 answers
- `/api/images` — calls SerpAPI Google Images, takes game title + answer, builds smart query (answer + context), returns image URLs
- Builder flow: Title → Generate 20 answers → Pick images → Review → Play
- Play mode: per-question stopwatch, pass sends question to back of queue, wrong removes it, game ends when queue empty
- Fuzzy matching for answers (accept partial names, last names, nicknames)

## ENV VARIABLES (never commit actual keys)
- `ANTHROPIC_API_KEY`
- `SERPAPI_KEY`

## RULES
- Never modify `.env.local`
- Never commit API keys
- Always use the Snapback brand colors — Yellow (#FFD700), Black (#0A0A0A), White (#F5F5F5). No generic blues/purples.
- All API routes go in `/api/` directory
- This is a CEO demo — everything should look polished and production-ready
- When in doubt, reference the existing Snapback app screenshots for UI patterns
