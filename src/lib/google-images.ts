interface GoogleSearchItem {
  link: string;
  image?: {
    contextLink: string;
    height: number;
    width: number;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
}

export async function searchImages(query: string, num: number = 4): Promise<string[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    throw new Error("Google Custom Search API key or Engine ID not configured");
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    searchType: "image",
    num: String(num),
    safe: "active",
  });

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Search API error: ${response.status} - ${errorText}`);
  }

  const data: GoogleSearchResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => item.link);
}
