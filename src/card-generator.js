/**
 * card-generator.js — 运势卡片本地合成引擎
 *
 * sharp 加载节气背景图 → SVG 文字叠加 → composite → 输出 PNG。
 * 本地运行，不经 OB，不调外部 API。秒级出图。
 *
 * Font: Noto Sans SC (SIL OFL, ~10MB) bundled as base64 JSON.
 * Embedded in SVG via @font-face — works on any OS with zero config.
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_SIZE = 768;

// Load bundled assets (base64 JSON — ClawHub text-file compatible, split to stay under 10MB limit)
const CARDS_BASE64 = JSON.parse(
  fs.readFileSync(path.join(__dirname, "assets", "cards-base64.json"), "utf-8")
);
// Font split into 3 parts to stay under ClawHub 10MB/file limit
const FONT_BASE64 = [1, 2, 3]
  .map(i => JSON.parse(fs.readFileSync(
    path.join(__dirname, "assets", `font-base64-${i}.json`), "utf-8"
  )).data)
  .join("");

// ── Public API ──

/**
 * Generate a personalized fortune card.
 * @returns {Promise<{card_base64: string, card_id: string}>}
 */
export async function generateCard({ type_name, one_liner, story_title, solar_term, date }) {
  const bgBase64 = CARDS_BASE64[solar_term];
  if (!bgBase64) {
    throw new Error(`no background for solar term: ${solar_term}`);
  }

  // 1. Render text overlay as SVG (with embedded font)
  const overlaySvg = buildOverlaySvg({ type_name, one_liner, story_title, solar_term, date });
  const overlayBuf = await sharp(Buffer.from(overlaySvg, "utf-8"))
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)
    .png()
    .toBuffer();

  // 2. Composite background + text
  const card = await sharp(Buffer.from(bgBase64, "base64"))
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover" })
    .composite([{ input: overlayBuf, top: 0, left: 0 }])
    .flatten({ background: "#f0f0f0" })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  const cardId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    card_base64: card.toString("base64"),
    card_id: cardId,
  };
}

// ── SVG Layout ──

function buildOverlaySvg({ type_name, one_liner, story_title, solar_term, date }) {
  const W = OUTPUT_SIZE;
  const H = OUTPUT_SIZE;
  const centerX = W / 2;
  const displayDate = date || new Date().toISOString().slice(0, 10);

  // Embedded Noto Sans SC via @font-face — no system font dependency
  const fontFace = `@font-face { font-family: 'CardFont'; src: url(data:font/truetype;base64,${FONT_BASE64}) format('truetype'); }`;
  const fontFamily = "'CardFont', sans-serif";

  // Line-wrap the fortune text
  const lines = wrapText(one_liner, 14);
  const tspans = lines.map((line, i) =>
    `<tspan x="${centerX}" dy="${i === 0 ? 0 : 52}">${esc(line)}</tspan>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      ${fontFace}
      text { font-family: ${fontFamily}; }
    </style>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="0.3">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0" y1="1" x2="0" y2="0.75">
      <stop offset="0%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#topFade)"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bottomFade)"/>

  <text x="48" y="72" font-size="24" fill="#ffffff" opacity="0.85" filter="url(#shadow)">
    ${esc(displayDate)} · ${esc(solar_term)}
  </text>

  <rect x="${W - 160}" y="36" width="112" height="40" rx="20" fill="#ffffff" opacity="0.25"/>
  <text x="${W - 104}" y="63" font-size="22" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
    ${esc(type_name)}
  </text>

  <text x="${centerX}" y="${H * 0.42}" font-size="40" fill="#ffffff"
        text-anchor="middle" filter="url(#shadow)" font-weight="bold">
    ${tspans}
  </text>

  <text x="${centerX}" y="${H - 110}" font-size="22" fill="#ffffff"
        text-anchor="middle" opacity="0.8" filter="url(#shadow)">
    📖 ${esc(story_title)}
  </text>

  <text x="${centerX}" y="${H - 45}" font-size="16" fill="#ffffff"
        text-anchor="middle" opacity="0.45">
    🦞 龙虾好运势
  </text>
</svg>`;
}

function wrapText(text, maxPerLine) {
  const lines = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxPerLine) {
      lines.push(remaining);
      break;
    }
    let cut = maxPerLine;
    for (let i = maxPerLine; i >= maxPerLine - 5 && i > 0; i--) {
      if (/[，。、；：？！\s,.]/.test(remaining[i])) {
        cut = i + 1;
        break;
      }
    }
    lines.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  return lines;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
