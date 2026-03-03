import { NextRequest, NextResponse } from "next/server";
import { generateAnswers, generateOneAnswer } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, replace, existing } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Game title is required" },
        { status: 400 }
      );
    }

    // Single replacement mode
    if (replace) {
      const existingAnswers: string[] = Array.isArray(existing) ? existing : [];
      const answer = await generateOneAnswer(title, existingAnswers);
      return NextResponse.json({ answer });
    }

    // Full generation mode (20 answers)
    const answers = await generateAnswers(title);
    return NextResponse.json({ answers });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate answers" },
      { status: 500 }
    );
  }
}
