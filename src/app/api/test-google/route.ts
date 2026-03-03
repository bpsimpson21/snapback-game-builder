import { NextResponse } from "next/server";
import { searchImages } from "@/lib/image-search";

export async function GET() {
  const apiKey = process.env.SERPAPI_KEY || "";

  console.log("[test-serpapi] SERPAPI_KEY set:", !!apiKey);
  console.log("[test-serpapi] SERPAPI_KEY prefix:", apiKey.slice(0, 10) + "...");

  try {
    const results = await searchImages("Derek Jeter Yankees baseball player", 2);

    console.log("[test-serpapi] results:", JSON.stringify(results, null, 2));

    return NextResponse.json({
      serpApiKeyPrefix: apiKey.slice(0, 10) + "...",
      query: "Derek Jeter Yankees baseball player",
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("[test-serpapi] error:", error);
    return NextResponse.json({
      serpApiKeyPrefix: apiKey.slice(0, 10) + "...",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
