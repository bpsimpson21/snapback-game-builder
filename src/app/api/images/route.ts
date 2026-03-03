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
    console.log("[/api/images POST] query:", query);
    console.log("[/api/images POST] API_KEY set:", !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY);
    console.log("[/api/images POST] ENGINE_ID set:", !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID);
    const images = await searchImages(query, 4);
    console.log("[/api/images POST] found", images.length, "images");
    return NextResponse.json({ images });
  } catch (error) {
    console.error("[/api/images POST] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search images" },
      { status: 500 }
    );
  }
}

// GET handler for browser testing: /api/images?q=Michael+Jordan+Chicago+Bulls
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required. Example: /api/images?q=Michael+Jordan" },
        { status: 400 }
      );
    }

    console.log("[/api/images GET] query:", q);
    console.log("[/api/images GET] API_KEY set:", !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY);
    console.log("[/api/images GET] ENGINE_ID set:", !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID);

    const images = await searchImages(q, 4);
    console.log("[/api/images GET] found", images.length, "images");
    return NextResponse.json({ query: q, count: images.length, images });
  } catch (error) {
    console.error("[/api/images GET] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search images" },
      { status: 500 }
    );
  }
}
