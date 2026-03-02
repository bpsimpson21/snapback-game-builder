import { NextRequest, NextResponse } from "next/server";
import { generateAnswers } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Game title is required" },
        { status: 400 }
      );
    }

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
