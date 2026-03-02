import { NextRequest, NextResponse } from "next/server";
import { searchImages } from "@/lib/google-images";

export async function POST(request: NextRequest) {
  try {
    const { title, answer } = await request.json();

    if (!title || !answer) {
      return NextResponse.json(
        { error: "Both title and answer are required" },
        { status: 400 }
      );
    }

    const query = `${title} ${answer}`;
    const images = await searchImages(query, 4);
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Images API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search images" },
      { status: 500 }
    );
  }
}
