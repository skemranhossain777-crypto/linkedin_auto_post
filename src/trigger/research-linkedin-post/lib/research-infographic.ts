import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

// Independent copy of the news workflow's lib/infographic.ts — same brand
// palette/fonts/logo/font-loading trick, but this workflow additionally
// rotates between 3 distinct layouts so consecutive research posts don't
// all look identical.

const WIDTH = 1200;
const HEIGHT = 630;

// Mr. Informer brand palette — see .claude/brand-asset/brand-reference.md
const PALETTE = {
  background: "#1F2937",
  accent: "#2563EB",
  accentSecondary: "#14B8A6",
  heading: "#FFFFFF",
  body: "#D1D5DB",
  muted: "#6B7280",
};

const LOGO_SIZE = 100;
let logoDataUri: string | null = null;

function getLogoDataUri(): string {
  if (logoDataUri) return logoDataUri;
  const path = join(process.cwd(), ".claude/brand-asset/logo-without-background.png");
  const base64 = readFileSync(path).toString("base64");
  logoDataUri = `data:image/png;base64,${base64}`;
  return logoDataUri;
}

let wasmInitPromise: Promise<void> | null = null;
function ensureWasmInit(): Promise<void> {
  if (!wasmInitPromise) {
    const wasmPath = join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm");
    wasmInitPromise = initWasm(readFileSync(wasmPath));
  }
  return wasmInitPromise;
}

type FontFamily = "Inter" | "Poppins";
const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(family: FontFamily, weight: 400 | 700): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; U; Android 4.2.1; en-us; Nexus 7 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Version/4.0 Safari/535.19",
    },
  }).then((r) => r.text());

  const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/);
  const fontUrl = match?.[1];
  if (!fontUrl) {
    throw new Error(`Could not resolve a truetype URL for ${family} weight ${weight}`);
  }

  const buffer = await fetch(fontUrl).then((r) => r.arrayBuffer());
  fontCache.set(key, buffer);
  return buffer;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function splitSentences(text: string): string[] {
  // Require the next sentence to start with a capital letter — plain
  // "split on period+space" breaks abbreviations like "U.S." or "Mr." into
  // fake sentence boundaries, since those are also followed by lowercase
  // continuations most of the time.
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ResearchInfographicInput {
  topic: string;
  summary: string;
  niche: string;
  source: string;
  publishedAt: string;
}

const logoElement = () => ({
  type: "img",
  props: {
    src: getLogoDataUri(),
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    style: { display: "flex" },
  },
});

const nicheTag = (niche: string) => ({
  type: "div",
  props: {
    style: {
      display: "flex",
      padding: "8px 20px",
      borderRadius: 999,
      backgroundColor: PALETTE.accent,
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    children: truncate(niche, 26),
  },
});

const footer = (source: string, publishedAt: string) => ({
  type: "div",
  props: {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderTop: `2px solid ${PALETTE.accentSecondary}`,
      paddingTop: 20,
    },
    children: [
      {
        type: "div",
        props: {
          style: { display: "flex", fontSize: 24, color: PALETTE.body, fontWeight: 700 },
          children: `Research · ${source}`,
        },
      },
      {
        type: "div",
        props: {
          style: { display: "flex", fontSize: 22, color: PALETTE.muted },
          children: publishedAt,
        },
      },
    ],
  },
});

// Variant A — headline + supporting snippet, closest to the news workflow's look.
function buildHeadlineCard(input: ResearchInfographicInput) {
  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        backgroundColor: PALETTE.background,
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
            children: [nicheTag(input.niche), logoElement()],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 20 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 48,
                    fontFamily: "Poppins",
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: PALETTE.heading,
                  },
                  children: truncate(input.topic, 110),
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 26,
                    lineHeight: 1.5,
                    color: PALETTE.body,
                  },
                  children: truncate(input.summary, 220),
                },
              },
            ],
          },
        },
        footer(input.source, input.publishedAt),
      ],
    },
  };
}

// Variant B — a single striking sentence as a large pull-quote.
function buildQuoteCard(input: ResearchInfographicInput) {
  const sentences = splitSentences(input.summary);
  const quote = sentences[0] ?? input.summary;

  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        backgroundColor: PALETTE.background,
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
            children: [nicheTag(input.niche), logoElement()],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 24 },
            children: [
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 96, color: PALETTE.accentSecondary, lineHeight: 1 },
                  children: "“",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: 42,
                    fontFamily: "Poppins",
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: PALETTE.heading,
                  },
                  children: truncate(quote, 160),
                },
              },
              {
                type: "div",
                props: {
                  style: { display: "flex", fontSize: 24, color: PALETTE.muted },
                  children: truncate(input.topic, 90),
                },
              },
            ],
          },
        },
        footer(input.source, input.publishedAt),
      ],
    },
  };
}

// Variant C — key points broken out as a short bulleted list.
function buildBulletCard(input: ResearchInfographicInput) {
  const points = splitSentences(input.summary).slice(0, 3);

  return {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        backgroundColor: PALETTE.background,
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
            children: [nicheTag(input.niche), logoElement()],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: 38,
              fontFamily: "Poppins",
              fontWeight: 700,
              lineHeight: 1.25,
              color: PALETTE.heading,
            },
            children: truncate(input.topic, 90),
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 18 },
            children: points.map((point) => ({
              type: "div",
              props: {
                style: { display: "flex", alignItems: "flex-start", gap: 16 },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        backgroundColor: PALETTE.accentSecondary,
                        marginTop: 10,
                        flexShrink: 0,
                      },
                      children: [],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: { display: "flex", fontSize: 24, lineHeight: 1.4, color: PALETTE.body },
                      children: truncate(point, 140),
                    },
                  },
                ],
              },
            })),
          },
        },
        footer(input.source, input.publishedAt),
      ],
    },
  };
}

const VARIANTS = [buildHeadlineCard, buildQuoteCard, buildBulletCard];

export async function renderResearchInfographicPng(input: ResearchInfographicInput): Promise<Buffer> {
  const [, interRegular, interBold, poppinsBold] = await Promise.all([
    ensureWasmInit(),
    loadFont("Inter", 400),
    loadFont("Inter", 700),
    loadFont("Poppins", 700),
  ]);

  const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)] ?? buildHeadlineCard;

  const svg = await satori(variant(input), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interBold, weight: 700, style: "normal" },
      { name: "Poppins", data: poppinsBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return Buffer.from(resvg.render().asPng());
}
