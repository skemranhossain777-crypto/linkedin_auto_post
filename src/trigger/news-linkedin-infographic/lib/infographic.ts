import { readFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

// @resvg/resvg-js ships a different native binary per OS/CPU as an optional
// dependency, which broke the deploy build (dev machine is Windows, deploy
// container is Linux — npm errored trying to resolve the mismatched
// platform package instead of just skipping it). The WASM build sidesteps
// that entirely: one universal binary, no platform-specific installs.
let wasmInitPromise: Promise<void> | null = null;
function ensureWasmInit(): Promise<void> {
  if (!wasmInitPromise) {
    const wasmPath = join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm");
    wasmInitPromise = initWasm(readFileSync(wasmPath));
  }
  return wasmInitPromise;
}

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

// The source PNG has heavy internal padding + a soft glow baked in, so it
// needs to render much bigger than a typical tight-cropped logo mark to
// actually read at a glance — 56px (the usual "small corner mark" size)
// turned into an illegible smudge in testing.
const LOGO_SIZE = 120;
let logoDataUri: string | null = null;

function getLogoDataUri(): string {
  if (logoDataUri) return logoDataUri;
  // "without-background" is correct here per brand-reference.md's rule of
  // thumb: we already paint Graphite behind it, so no card is needed.
  const path = join(process.cwd(), ".claude/brand-asset/logo-without-background.png");
  const base64 = readFileSync(path).toString("base64");
  logoDataUri = `data:image/png;base64,${base64}`;
  return logoDataUri;
}

type FontFamily = "Inter" | "Poppins";
const fontCache = new Map<string, ArrayBuffer>();

async function loadFont(family: FontFamily, weight: 400 | 700): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  // Google Fonts serves raw .ttf (instead of .woff2/.eot) to old-Android user
  // agents — satori needs a raw sfnt buffer, and this is the only UA variant
  // that reliably returns 'format('truetype')' rather than EOT or WOFF2.
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

export interface InfographicInput {
  headline: string;
  source: string;
  niche: string;
  publishedAt: string;
}

export async function renderInfographicPng(input: InfographicInput): Promise<Buffer> {
  const [, interRegular, interBold, poppinsBold] = await Promise.all([
    ensureWasmInit(),
    loadFont("Inter", 400),
    loadFont("Inter", 700),
    loadFont("Poppins", 700),
  ]);

  const svg = await satori(
    {
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
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      padding: "8px 20px",
                      borderRadius: 999,
                      backgroundColor: PALETTE.accent,
                      color: "#FFFFFF",
                      fontSize: 22,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    },
                    children: truncate(input.niche, 28),
                  },
                },
                {
                  type: "img",
                  props: {
                    src: getLogoDataUri(),
                    width: LOGO_SIZE,
                    height: LOGO_SIZE,
                    style: { display: "flex" },
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: 56,
                fontFamily: "Poppins",
                fontWeight: 700,
                lineHeight: 1.25,
                color: PALETTE.heading,
              },
              children: truncate(input.headline, 140),
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: `2px solid ${PALETTE.accentSecondary}`,
                paddingTop: 24,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", fontSize: 28, color: PALETTE.body, fontWeight: 700 },
                    children: input.source || "News",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: { display: "flex", fontSize: 24, color: PALETTE.muted },
                    children: input.publishedAt,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
        { name: "Poppins", data: poppinsBold, weight: 700, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  // Buffer.from(typedArray) — not .buffer — since asPng() may return a view
  // into a larger WASM linear-memory ArrayBuffer with a nonzero byteOffset.
  return Buffer.from(resvg.render().asPng());
}
