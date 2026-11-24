// THE WORLD TODAY — Tuesday 24 November 2026.
// A program that draws one 1024x1024 front page summing up the day's world news,
// entirely from code: a hand-built 5x7 pixel font, a framebuffer, and a small
// PNG encoder written on the standard library alone. No network, no assets,
// no randomness: two runs write byte-identical output.
//
// Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it with /output as the output directory.

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Colour palette: newsprint cream, black ink, one red accent, six panel inks.
// ---------------------------------------------------------------------------
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [20, 18, 16];
const WHITE: RGB = [255, 253, 245];
const RED: RGB = [179, 39, 30];
const STRIP: RGB = [242, 227, 161];
const LEAD_BG: RGB = [255, 253, 245];
const MUTED: RGB = [90, 84, 74];

type RGB = [number, number, number];

// ---------------------------------------------------------------------------
// A 5x7 pixel font, drawn from scratch for this page. Each glyph is seven rows
// of five bits, most-significant bit first (the leftmost column).
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0b01100, 0b01100],
  ',': [0, 0, 0, 0, 0b01100, 0b00100, 0b01000],
  ':': [0, 0b01100, 0b01100, 0, 0b01100, 0b01100, 0],
  ';': [0, 0b01100, 0b01100, 0, 0b01100, 0b00100, 0b01000],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0, 0b00100],
  '?': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0, 0b00100],
  "'": [0b00100, 0b00100, 0b01000, 0, 0, 0, 0],
  '"': [0b01010, 0b01010, 0b01010, 0, 0, 0, 0],
  '-': [0, 0, 0, 0b01110, 0, 0, 0],
  '\u2014': [0, 0, 0, 0b11111, 0, 0, 0],
  '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  '%': [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  '+': [0, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0],
  '=': [0, 0, 0b11111, 0, 0b11111, 0, 0],
  $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  '#': [0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010],
  '*': [0, 0b00100, 0b10101, 0b01110, 0b10101, 0b00100, 0],
  '\u2022': [0, 0, 0b01100, 0b01100, 0b01100, 0, 0],
  '@': [0b01110, 0b10001, 0b10111, 0b10101, 0b10110, 0b10000, 0b01110],
  _: [0, 0, 0, 0, 0, 0, 0b11111],
  '<': [0b00010, 0b00100, 0b01000, 0b10000, 0b01000, 0b00100, 0b00010],
  '>': [0b01000, 0b00100, 0b00010, 0b00001, 0b00010, 0b00100, 0b01000],
};

// ---------------------------------------------------------------------------
// Framebuffer: a 1024x1024 RGB canvas with rectangle, line and text drawing.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;

class Page {
  pixels = new Uint8Array(W * H * 3);

  constructor() {
    this.fillRect(0, 0, W, H, PAPER);
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.pixels[i] = c[0];
    this.pixels[i + 1] = c[1];
    this.pixels[i + 2] = c[2];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
  }

  frame(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y, t, h, c);
    this.fillRect(x + w - t, y, t, h, c);
  }

  // Straight line, any slope, by stepping along the longer axis.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + (dx * s) / steps);
      const y = Math.round(y0 + (dy * s) / steps);
      this.fillRect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
    }
  }

  // One glyph, scaled: each font pixel becomes a scale x scale block.
  // Bold draws every pixel twice, one pixel to the right, for a heavier face.
  glyph(ch: string, x: number, y: number, scale: number, c: RGB, bold: boolean): void {
    const g = FONT[ch] ?? FONT['?'];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if ((g[row] >> (4 - col)) & 1) {
          this.fillRect(x + col * scale, y + row * scale, scale, scale, c);
          if (bold) this.fillRect(x + col * scale + 1, y + row * scale, scale, scale, c);
        }
      }
    }
  }

  // Draw a string; boldUntil makes the first boldUntil characters bold.
  text(s: string, x: number, y: number, scale: number, c: RGB, boldUntil = 0): number {
    const upper = s.toUpperCase();
    let cx = x;
    for (let i = 0; i < upper.length; i++) {
      this.glyph(upper[i], cx, y, scale, c, i < boldUntil);
      cx += 6 * scale;
    }
    return cx;
  }

  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale;
  }

  // Word-wrap a string to lines of at most maxChars characters.
  wrap(s: string, maxChars: number): string[] {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur === '' ? w : cur + ' ' + w;
      if (next.length <= maxChars) {
        cur = next;
      } else {
        if (cur !== '') lines.push(cur);
        cur = w;
      }
    }
    if (cur !== '') lines.push(cur);
    return lines;
  }

  // Wrapped paragraph; the first boldUntil characters of the whole text are bold.
  paragraph(s: string, x: number, y: number, maxChars: number, scale: number, c: RGB, boldUntil = 0): number {
    const lines = this.wrap(s.toUpperCase(), maxChars);
    let offset = 0;
    let cy = y;
    for (const line of lines) {
      const boldHere = Math.max(0, Math.min(line.length, boldUntil - offset));
      this.text(line, x, cy, scale, c, boldHere);
      offset += line.length + 1;
      cy += 8 * scale;
    }
    return cy;
  }
}

// ---------------------------------------------------------------------------
// PNG encoder: 8-bit RGB, no filter, zlib level 9. Fully deterministic.
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(page: Page): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(page.pixels.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// The day's news. Every story below was first reported on Tuesday 24 November
// 2026 (or on Monday evening UTC, which is Tuesday in Asia-Pacific time):
// verified against Reuters, AP, CNN, The Hindu and The Times of India the
// morning the page was drawn. The lead phrase of each story is set bold.
// ---------------------------------------------------------------------------
interface Story {
  lead: string;
  body: string;
}

interface Panel {
  title: string;
  color: RGB;
  stories: Story[];
}

const LEAD: { kicker: string; headline: string; body: string } = {
  kicker: 'LEAD STORY \u2014 WALL STREET',
  headline: 'HUANG IS BACK',
  body: "NVIDIA'S BOARD REINSTATES JENSEN HUANG AS CHIEF EXECUTIVE WITH IMMEDIATE EFFECT, 12 DAYS AFTER HE RESIGNED. SHARES CLOSE 31% HIGHER AND LIFT THE NASDAQ 6.5% AND THE S&P 500 4.7%.",
};

const PANELS: Panel[] = [
  {
    title: 'EUROPE',
    color: [31, 58, 95],
    stories: [
      { lead: 'POLAND ON ALERT', body: 'RUSSIAN DRONE BRIEFLY ENTERS POLISH AIRSPACE.' },
      { lead: 'NATO AWACS EAST', body: 'NATO SENDS A RADAR PLANE TO POLAND.' },
      { lead: 'COP31 COLLAPSES', body: 'CLIMATE TALKS END WITH NO DEAL.' },
      { lead: 'BERLIN BUYS IN', body: "GERMANY ADOPTS UKRAINE'S DELTA SYSTEM." },
      { lead: 'MURMANSK HELD', body: 'MURMANSK GOVERNOR DETAINED FOR GRAFT.' },
    ],
  },
  {
    title: 'MIDDLE EAST & AFRICA',
    color: [122, 31, 31],
    stories: [
      { lead: 'GAZA STRIKES', body: 'THREE KILLED IN GAZA, A UN WORKER AMONG THEM.' },
      { lead: 'IRAN LASHES SINGER', body: 'SINGER AND FOUR OF HER TEAM GET 74 LASHES.' },
      { lead: 'BLOCKADE WARNING', body: 'IRAN VOWS TO CONFRONT A US NAVAL BLOCKADE.' },
      { lead: 'SANCTIONS HIT', body: 'THE US SANCTIONS DOZENS LINKED TO IRAN.' },
      { lead: 'WAR AT SEA', body: 'UKRAINE SANK A RUSSIAN WARSHIP OFF LIBYA.' },
    ],
  },
  {
    title: 'ASIA-PACIFIC',
    color: [15, 91, 77],
    stories: [
      { lead: 'FACTORY FIRE', body: '24 DEAD, 30 MISSING IN INDONESIA FACTORY FIRE.' },
      { lead: 'KOREA WARNING', body: 'ULLEUNG ISLAND WARNED AS RUSSIAN JET ENTERS.' },
      { lead: "INDIA'S AI PUSH", body: 'MODI OPENS AN AI CENTRE AT IIT PATNA.' },
      { lead: 'BORDER TALKS', body: 'INDIA AND CHINA HOLD MILITARY TALKS.' },
      { lead: 'LAHORE CHOKES', body: 'AQI PASSES 500 AS LAHORE TOPS POLLUTION LIST.' },
    ],
  },
  {
    title: 'AMERICAS',
    color: [90, 90, 31],
    stories: [
      { lead: 'IOWA PAUSE', body: 'TRUMP ORDERS THE ARMY TO PAUSE A DETONATION.' },
      { lead: "O'HARE HALT", body: "CHICAGO'S O'HARE HALTS FLIGHTS FOR THANKSGIVING." },
      { lead: 'DRUG LORD HELD', body: 'MEXICO CAPTURES CARTEL SUSPECT CHAPO ISIDRO.' },
      { lead: 'FRAUD RAID', body: 'AGENTS RAID CHILD CARE CENTRES IN A $41M CASE.' },
      { lead: 'MAYOR JAILED', body: 'EX-MAYOR OF JACKSON GETS 37 MONTHS FOR BRIBERY.' },
    ],
  },
  {
    title: 'TECH & MARKETS',
    color: [74, 42, 90],
    stories: [
      { lead: 'WALL ST RALLY', body: 'NASDAQ JUMPS 6.5%, S&P 500 GAINS 4.7%.' },
      { lead: 'ANTHROPIC DIPS', body: 'NEWLY LISTED ANTHROPIC SLIDES 1.4%.' },
      { lead: 'HUANG TO TESTIFY', body: 'HOUSE PANELS SAY SECURITY FEARS REMAIN.' },
      { lead: 'SENSEX SLIDES', body: "INDIA'S SENSEX FALLS 1,484 POINTS TO 82,435." },
      { lead: 'OIL EASES', body: 'OIL FALLS AS MIDDLE EAST SUPPLY GROWS.' },
    ],
  },
  {
    title: 'SPORT & CULTURE',
    color: [47, 74, 94],
    stories: [
      { lead: 'ALCARAZ REIGNS', body: 'ALCARAZ BEATS ZVEREV 6-2, 7-6 FOR THE TITLE.' },
      { lead: 'VERSTAPPEN WINS', body: 'VERSTAPPEN TAKES THE LAS VEGAS GRAND PRIX.' },
      { lead: 'CHESS BEGINS', body: 'GUKESH MEETS SINDAROV IN GAME 1 IN GENEVA.' },
      { lead: 'TEST DRAWN', body: 'INDIA AND NEW ZEALAND DRAW THE FIRST TEST.' },
      { lead: 'SWIFT PLOT FOILED', body: "MOSSAD STOPPED AN ISIS PLOT ON SWIFT'S GIGS." },
    ],
  },
];

const MARKETS =
  'MARKETS  NASDAQ +6.5%  S&P 500 +4.7%  NVIDIA +31%  SENSEX -1.8%  OIL DOWN';

const FOOTER =
  '31 STORIES FIRST REPORTED 24 NOV 2026 \u2022 SOURCES: REUTERS, AP, CNN \u2022 DRAWN IN CODE';

// ---------------------------------------------------------------------------
// Layout: masthead, markets strip, lead story with a surge chart, six
// regional panels in two rows of three, and a footer line.
// ---------------------------------------------------------------------------
const M = 14; // outer margin
const CW = W - 2 * M; // 996 content width

function drawMasthead(p: Page): void {
  p.fillRect(M, M, CW, 118, INK);
  const title = 'THE WORLD TODAY';
  const tx = M + Math.floor((CW - p.textWidth(title, 8)) / 2);
  p.text(title, tx, 30, 8, WHITE);
  p.fillRect(M + 130, 96, CW - 260, 4, RED);
  const date = 'TUESDAY 24 NOVEMBER 2026';
  const dx = M + Math.floor((CW - p.textWidth(date, 3)) / 2);
  p.text(date, dx, 106, 3, WHITE);
}

function drawMarkets(p: Page): void {
  p.fillRect(M, 140, CW, 30, STRIP);
  p.frame(M, 140, CW, 30, INK, 2);
  const tw = p.textWidth(MARKETS, 2);
  p.text(MARKETS, M + Math.floor((CW - tw) / 2), 149, 2, INK);
}

function drawLead(p: Page): void {
  const x = M;
  const y = 178;
  const w = CW;
  const h = 170;
  p.fillRect(x, y, w, h, LEAD_BG);
  p.frame(x, y, w, h, INK, 2);
  p.text(LEAD.kicker, x + 16, y + 14, 2, RED, LEAD.kicker.length);
  p.text(LEAD.headline, x + 16, y + 36, 7, INK, LEAD.headline.length);
  p.paragraph(LEAD.body, x + 16, y + 96, 50, 2, INK);

  // Surge chart on the right: three bars for the day's jumps, with a red
  // arrow climbing across them.
  const cx = x + 668;
  const base = y + 146;
  const bars: { label: string; pct: number; color: RGB }[] = [
    { label: 'NVIDIA +31%', pct: 31, color: RED },
    { label: 'NASDAQ +6.5%', pct: 6.5, color: [31, 58, 95] },
    { label: 'S&P +4.7%', pct: 4.7, color: [15, 91, 77] },
  ];
  p.line(cx - 8, base, cx + 296, base, INK, 2);
  bars.forEach((b, i) => {
    const bx = cx + i * 100;
    const bh = Math.round(b.pct * 3.4);
    p.fillRect(bx, base - bh, 62, bh, b.color);
    p.text(b.label, bx - 2, base + 6, 1, INK);
  });
  p.line(cx + 6, base - 6, cx + 110, base - 70, RED, 3);
  p.line(cx + 110, base - 70, cx + 210, base - 100, RED, 3);
  p.line(cx + 210, base - 100, cx + 292, base - 118, RED, 3);
  p.text('SHARES SURGE', cx + 150, y + 12, 2, RED, 12);
}

function drawPanel(p: Page, panel: Panel, x: number, y: number, w: number, h: number): void {
  p.fillRect(x, y, w, h, WHITE);
  p.frame(x, y, w, h, INK, 2);
  p.fillRect(x + 2, y + 2, w - 4, 30, panel.color);
  p.text(panel.title, x + 12, y + 11, 2, WHITE, panel.title.length);
  let cy = y + 42;
  for (const s of panel.stories) {
    const full = s.lead + ' \u2014 ' + s.body;
    p.fillRect(x + 12, cy + 3, 7, 7, panel.color);
    cy = p.paragraph(full, x + 26, cy, 23, 2, INK, s.lead.length);
    cy += 4;
  }
}

function drawFooter(p: Page): void {
  const tw = p.textWidth(FOOTER, 2);
  p.text(FOOTER, M + Math.floor((CW - tw) / 2), 994, 2, MUTED);
}

function buildPage(): Page {
  const p = new Page();
  drawMasthead(p);
  drawMarkets(p);
  drawLead(p);
  const pw = 324;
  const ph = 308;
  const xs = [M, M + pw + 12, M + 2 * (pw + 12)];
  const ys = [358, 676];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      drawPanel(p, PANELS[r * 3 + c], xs[c], ys[r], pw, ph);
    }
  }
  drawFooter(p);
  return p;
}

// ---------------------------------------------------------------------------
// Entry point: write /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png).
// ---------------------------------------------------------------------------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePng(buildPage());
const outPath = join(outDir, 'entry.png');
writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, sha256 ${createHash('sha256').update(png).digest('hex')})`);
