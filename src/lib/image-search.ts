export interface ImageResult {
  url: string;
  thumbnail: string;
  title: string;
}

interface SerpApiImageResult {
  original: string;
  thumbnail: string;
  title: string;
  source: string;
}

interface SerpApiResponse {
  images_results?: SerpApiImageResult[];
  error?: string;
}

export async function searchImages(query: string, num: number = 4): Promise<ImageResult[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    throw new Error("SERPAPI_KEY is not configured");
  }

  const params = new URLSearchParams({
    engine: "google_images",
    q: query,
    api_key: apiKey,
    num: String(num),
    tbs: "iar:w", // wide/landscape images only
  });

  const url = `https://serpapi.com/search.json?${params.toString()}`;
  console.log("[image-search] fetching:", url.replace(apiKey, "***"));

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[image-search] API error response:", errorText);
    throw new Error(`SerpAPI error: ${response.status} - ${errorText}`);
  }

  const data: SerpApiResponse = await response.json();

  if (data.error) {
    console.error("[image-search] SerpAPI error:", data.error);
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  console.log("[image-search] results count:", data.images_results?.length ?? 0);

  if (!data.images_results || data.images_results.length === 0) {
    return [];
  }

  return data.images_results.slice(0, num).map((result) => ({
    url: result.original,
    thumbnail: result.thumbnail,
    title: result.title,
  }));
}
