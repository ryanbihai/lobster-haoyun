/**
 * card-generator.js — 运势卡片本地合成引擎
 *
 * sharp 加载节气背景图 → SVG 文字叠加 → composite → 输出 PNG。
 * 本地运行，不经 OB，不调外部 API。秒级出图。
 *
 * Font: system font stack — 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif
 * Covers Win/Mac/Linux with consistent Simplified Chinese rendering.
 * No font file bundled (saves ~10MB).
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.join(__dirname, "assets", "cards");
const OUTPUT_SIZE = 768;

// Cross-platform Simplified Chinese font stack
const FONT_STACK = "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif";

// ── Public API ──

/**
 * Generate a personalized fortune card.
 * @returns {Promise<{card_base64: string, card_id: string}>}
 */
export async function generateCard({ type_name, one_liner, story_title, solar_term, date }) {
  const bgFile = path.join(CARDS_DIR, `${solar_term}.webp`);
  if (!fs.existsSync(bgFile)) {
    throw new Error(`no background for solar term: ${solar_term}`);
  }

  // 1. Render text overlay as SVG
  const overlaySvg = buildOverlaySvg({ type_name, one_liner, story_title, solar_term, date });
  const overlayBuf = await sharp(Buffer.from(overlaySvg, "utf-8"))
    .resize(OUTPUT_SIZE, OUTPUT_SIZE)
    .png()
    .toBuffer();

  // 2. Composite background + text in one pipeline
  const card = await sharp(bgFile)
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

  // Line-wrap the fortune text
  const lines = wrapText(one_liner, 14);
  const tspans = lines.map((line, i) =>
    `<tspan x="${centerX}" dy="${i === 0 ? 0 : 52}">${esc(line)}</tspan>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      text { font-family: ${FONT_STACK}; }
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

  <!-- Gradient overlays for text readability -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#topFade)"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#bottomFade)"/>

  <!-- Date + Solar term -->
  <text x="48" y="72" font-size="24" fill="#ffffff" opacity="0.85" filter="url(#shadow)">
    ${esc(displayDate)} · ${esc(solar_term)}
  </text>

  <!-- Type name badge -->
  <rect x="${W - 160}" y="36" width="112" height="40" rx="20" fill="#ffffff" opacity="0.25"/>
  <text x="${W - 104}" y="63" font-size="22" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
    ${esc(type_name)}
  </text>

  <!-- Fortune one-liner (center) -->
  <text x="${centerX}" y="${H * 0.42}" font-size="40" fill="#ffffff"
        text-anchor="middle" filter="url(#shadow)" font-weight="bold">
    ${tspans}
  </text>

  <!-- Story title -->
  <text x="${centerX}" y="${H - 110}" font-size="22" fill="#ffffff"
        text-anchor="middle" opacity="0.8" filter="url(#shadow)">
    📖 ${esc(story_title)}
  </text>

  <!-- Watermark -->
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
