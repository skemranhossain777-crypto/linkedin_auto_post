export interface NewsArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  guid: string;
}

// Domain fragments have no separators (e.g. "apnews", "foxnews"), so naive
// capitalization alone can't recover multi-word outlet names — this covers
// the common ones and falls back to a plain capitalize for anything else.
const KNOWN_OUTLETS: Record<string, string> = {
  apnews: "AP News",
  foxnews: "Fox News",
  theguardian: "The Guardian",
  businessinsider: "Business Insider",
  fourweekmba: "FourWeekMBA",
  sqmagazine: "SQ Magazine",
  greenwichtime: "Greenwich Time",
  sfchronicle: "SF Chronicle",
  nytimes: "The New York Times",
  wsj: "The Wall Street Journal",
  techcrunch: "TechCrunch",
  venturebeat: "VentureBeat",
  theverge: "The Verge",
  arstechnica: "Ars Technica",
  cnbc: "CNBC",
  bloomberg: "Bloomberg",
  reuters: "Reuters",
  engadget: "Engadget",
  wired: "Wired",
};

function prettifySource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const base = hostname.split(".")[0] ?? hostname;
    return KNOWN_OUTLETS[base.toLowerCase()] ?? base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return "News";
  }
}

interface TavilyResult {
  title: string;
  url: string;
  published_date?: string;
}

export async function fetchTavilyNews(query: string, days = 1): Promise<NewsArticle[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      topic: "news",
      search_depth: "basic",
      max_results: 20,
      days,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { results: TavilyResult[] };

  return json.results
    .filter((r): r is TavilyResult & { published_date: string } => Boolean(r.published_date))
    .map((r) => ({
      title: r.title,
      link: r.url,
      source: prettifySource(r.url),
      pubDate: r.published_date,
      guid: r.url,
    }));
}
