import { NextRequest, NextResponse } from "next/server";
import { searchImages } from "@/lib/image-search";

// Build a search query from the game title context + answer name
// e.g. title="Name That 2010s Redskin", answer="Robert Griffin III"
//   → "Robert Griffin III Washington Redskins football player"
const TEAM_MAP: Record<string, string> = {
  redskin: "Washington Redskins football",
  bull: "Chicago Bulls basketball",
  yankee: "New York Yankees baseball",
  laker: "Los Angeles Lakers basketball",
  warrior: "Golden State Warriors basketball",
  patriot: "New England Patriots football",
  cowboy: "Dallas Cowboys football",
  celtic: "Boston Celtics basketball",
  dodger: "Los Angeles Dodgers baseball",
  packer: "Green Bay Packers football",
  steeler: "Pittsburgh Steelers football",
  eagle: "Philadelphia Eagles football",
  bear: "Chicago Bears football",
  giant: "New York Giants football",
  met: "New York Mets baseball",
  cub: "Chicago Cubs baseball",
  raider: "Las Vegas Raiders football",
  jet: "New York Jets football",
  heat: "Miami Heat basketball",
  spur: "San Antonio Spurs basketball",
  rocket: "Houston Rockets basketball",
  commander: "Washington Commanders football",
};

function buildImageQuery(title: string, answer: string): string {
  const rawContext = title
    .replace(/^name\s+that\s+/i, "")
    .replace(/\d{2,4}s?\s*/i, "")
    .trim()
    .toLowerCase();

  const teamContext = TEAM_MAP[rawContext] || `${rawContext} sports`;
  return `${answer} ${teamContext} player`;
}

export async function POST(request: NextRequest) {
  try {
    const { title, answer } = await request.json();

    if (!title || !answer) {
      return NextResponse.json(
        { error: "Both title and answer are required" },
        { status: 400 }
      );
    }

    const query = buildImageQuery(title, answer);
    console.log("[/api/images POST] query:", query);
    const results = await searchImages(query, 4);
    console.log("[/api/images POST] found", results.length, "images");

    // Return just the URLs for backward compat with existing frontend
    const images = results.map((r) => r.url);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("[/api/images POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search images" },
      { status: 500 }
    );
  }
}

// GET handler for browser testing: /api/images?q=Derek+Jeter+Yankees
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required. Example: /api/images?q=Derek+Jeter+Yankees" },
        { status: 400 }
      );
    }

    console.log("[/api/images GET] query:", q);
    const results = await searchImages(q, 4);
    console.log("[/api/images GET] found", results.length, "images");
    return NextResponse.json({ query: q, count: results.length, images: results });
  } catch (error) {
    console.error("[/api/images GET] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search images" },
      { status: 500 }
    );
  }
}
