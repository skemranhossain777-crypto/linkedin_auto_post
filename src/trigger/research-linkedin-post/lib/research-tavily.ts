// Independent copy from the news-linkedin-infographic workflow's lib/tavily.ts
// — kept separate on purpose so the two workflows never share code that could
// break one when changing the other.

export interface TopicCandidate {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

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

function requireApiKey(): string {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");
  return apiKey;
}

interface TavilyResult {
  title: string;
  url: string;
  published_date?: string;
}

// Broad discovery pass: what's currently being talked about in this niche.
export async function fetchTrendingTopics(niche: string, days = 1): Promise<TopicCandidate[]> {
  const apiKey = requireApiKey();

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: niche,
      topic: "news",
      search_depth: "basic",
      max_results: 20,
      days,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily topic search failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { results: TavilyResult[] };

  return json.results
    .filter((r): r is TavilyResult & { published_date: string } => Boolean(r.published_date))
    .map((r) => ({
      title: r.title,
      link: r.url,
      source: prettifySource(r.url),
      pubDate: r.published_date,
    }));
}

export interface ResearchSummary {
  summary: string;
  sources: Array<{ title: string; url: string }>;
}

// Focused pass: ask Tavily to synthesize an actual research summary about one
// specific topic/angle, not just return snippets.
export async function researchTopic(topicTitle: string): Promise<ResearchSummary> {
  const apiKey = requireApiKey();

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: topicTitle,
      topic: "news",
      search_depth: "advanced",
      max_results: 5,
      include_answer: "advanced",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily research query failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as {
    answer?: string;
    results: Array<{ title: string; url: string }>;
  };

  if (!json.answer) {
    throw new Error(`Tavily did not return a synthesized answer for topic: ${topicTitle}`);
  }

  return {
    summary: json.answer,
    sources: json.results.slice(0, 3).map((r) => ({ title: r.title, url: r.url })),
  };
}
