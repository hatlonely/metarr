import type { ExtractResult, MediaIds, TitleCandidate } from '../types/media.js';
import { parseTags, stripMediaTags } from './tag-parser.js';

// CJK character / punctuation ranges
const CJK = '一-鿿㐀-䶿豈-﫿';
const CJK_PUNCT = '　-〿＀-￯';
// A Chinese segment starts with a CJK char and may absorb trailing digits so
// sequel numbers stay attached (e.g. 沙丘2 / 庆余年2).
const CJK_SEG_RE = new RegExp(`[${CJK}${CJK_PUNCT}][${CJK}${CJK_PUNCT}\\d]*`, 'g');
const CJK_ANY_RE = new RegExp(`[${CJK}${CJK_PUNCT}]`, 'g');
const CJK_TEST_RE = new RegExp(`[${CJK}${CJK_PUNCT}]`);

const CURRENT_YEAR = new Date().getFullYear();

// --- External IDs ---------------------------------------------------------

const ID_PATTERNS: { key: keyof MediaIds; re: RegExp }[] = [
  { key: 'imdb', re: /imdb(?:id)?[-_\s:]*?(tt\d+)/i },
  { key: 'tmdb', re: /tmdb(?:id)?[-_\s:]*?(\d+)/i },
  { key: 'tvdb', re: /tvdb(?:id)?[-_\s:]*?(\d+)/i },
  { key: 'douban', re: /douban(?:id)?[-_\s:]*?(\d+)/i },
];

/** Extract any embedded TMDB/IMDB/TVDB/Douban IDs (e.g. `[tmdbid-1399]`). */
export function extractIds(name: string): MediaIds {
  const ids: MediaIds = {};
  for (const { key, re } of ID_PATTERNS) {
    const m = name.match(re);
    if (!m) continue;
    if (key === 'imdb') ids.imdb = m[1];
    else ids[key] = parseInt(m[1], 10);
  }
  return ids;
}

// --- Year ------------------------------------------------------------------

/** All plausible 4-digit years, most likely first (parenthesized / near tags win). */
export function extractYearCandidates(name: string): number[] {
  const scored = new Map<number, number>();
  const re = /(\d{4})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(name))) {
    const y = parseInt(m[1], 10);
    if (y < 1900 || y > CURRENT_YEAR + 1) continue;
    const idx = m.index;
    let score = 0;
    if (name[idx - 1] === '(' && name[idx + 4] === ')') score += 3;
    const tail = name.slice(idx + 4, idx + 16);
    if (/^[.\s_-]*(?:\d{3,4}[piPI]|4[kK]|WEB|Blu|HDTV|REMUX|2160|1080|720)/.test(tail)) score += 2;
    scored.set(y, Math.max(scored.get(y) ?? 0, score));
  }
  return [...scored.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]).map((e) => e[0]);
}

// --- Season / episode hints (from the name only) ---------------------------

export function extractSeasonHint(name: string): number | undefined {
  const m =
    name.match(/[Ss](\d{1,2})(?:[Ee]\d{1,3})?/) ||
    name.match(/Season\s*(\d{1,2})/i) ||
    name.match(/第\s*(\d{1,2})\s*季/);
  return m ? parseInt(m[1], 10) : undefined;
}

export function hasEpisodeHint(name: string): boolean {
  return (
    /[Ss]\d{1,2}[Ee]\d{1,3}/.test(name) ||
    /\bE(?:P)?\d{1,3}\b/i.test(name) ||
    /第\s*\d{1,3}\s*[集话話]/.test(name) ||
    /\b\d{1,2}x\d{1,3}\b/i.test(name)
  );
}

// --- Title candidates ------------------------------------------------------

// Chinese segments that are clearly release metadata, not a title.
const META_CJK =
  /(全\d+集|国语|粤语|中字|双语|字幕|音轨|配音|高清|蓝光|杜比|视界|版本|高码|简体|繁体|简繁|外挂|未删减|导演剪辑|重制|修复)/;

// Release-noise tokens to drop from an English title — encoding/source/edition
// words and language tags only. Real grammar words (the/a/of/and/…) are kept,
// since they're part of titles ("Portrait of a Beauty", "Beauty and the Beast").
const EN_RELEASE_NOISE = new Set([
  'web', 'dl', 'webrip', 'bluray', 'bdrip', 'hdtv', 'hdrip', 'dvdrip', 'remux',
  'hdr', 'dv', 'hq', 'iq', 'sdr', 'dovi', 'extended', 'proper', 'repack', 'internal',
  'version', 'complete', 'korean', 'japanese', 'chinese', 'cantonese', 'mandarin',
  'french', 'german', 'spanish', 'italian', 'russian',
]);

function normKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '').replace(/[._-]/g, '');
}

interface Pusher {
  (query: string, lang: TitleCandidate['lang'], source: TitleCandidate['source'], weight: number): void;
}

/** Split a (already tag-stripped) text into Chinese + English title candidates. */
function splitToCandidates(text: string, source: TitleCandidate['source'], base: number, push: Pusher) {
  // Chinese: each contiguous CJK segment, dropping metadata-only ones
  for (const seg of text.match(CJK_SEG_RE) ?? []) {
    const q = seg.trim();
    if (q.length >= 1 && !META_CJK.test(q)) push(q, 'zh', source, base + 0.05);
  }
  // English: strip CJK, normalize separators, drop stopwords / pure numbers
  const ascii = text.replace(CJK_ANY_RE, ' ').replace(/[._]/g, ' ');
  const tokens = ascii
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w) && !EN_RELEASE_NOISE.has(w.toLowerCase()));
  const q = tokens.join(' ').trim();
  if (q.length >= 2) push(q, 'en', source, base);
}

/** Reduce a raw name to the title region (strip site/brackets/ids/tags/group/year/season). */
function toTitleZone(name: string): string {
  let work = name;
  // Drop a trailing media extension first, otherwise it leaks into a candidate
  // ("mkv") and shields the release group from the trailing-group strip below.
  work = work.replace(
    /\.(mkv|mp4|avi|wmv|mov|ts|m2ts|rmvb|flv|webm|srt|ass|ssa|sub|idx|sup)$/i,
    '',
  );
  work = work.replace(/【[^】]*】/g, ' '); // site/release-group prefix in 【】
  work = work.replace(/\[[^\]]*\]/g, ' '); // bracketed metadata / ids
  work = work.replace(/_副本\d*|_copy\d*/gi, ' ');
  work = work.replace(/(?:imdb|tmdb|tvdb|douban)(?:id)?[-_\s:]*(?:tt)?\d+/gi, ' ');
  work = stripMediaTags(work);
  work = work.replace(/-[A-Za-z0-9]+\s*$/, ' '); // trailing release group
  for (const y of extractYearCandidates(name)) {
    work = work.replace(new RegExp(`(?<![\\d])${y}(?![\\d])`, 'g'), ' ');
  }
  work = work.replace(/[Ss]\d{1,2}[Ee]\d{1,3}(?:[-Ee]\d{1,3})?/g, ' ');
  work = work.replace(/[Ss]\d{1,2}\b/g, ' ');
  work = work.replace(/\b\d{1,2}x\d{1,3}\b/gi, ' ');
  work = work.replace(/Season\s*\d+/gi, ' ');
  work = work.replace(/第\s*\d+\s*[季集话話]/g, ' ');
  work = work.replace(/\bE(?:P)?\d{1,3}\b/gi, ' ');
  return work;
}

/** Produce ranked, de-duplicated title candidates from one name. */
export function extractTitleCandidates(
  name: string,
  source: TitleCandidate['source'] = 'dir',
): TitleCandidate[] {
  const byKey = new Map<string, TitleCandidate>();
  const push: Pusher = (query, lang, src, weight) => {
    const q = query.trim();
    const nk = normKey(q);
    if (!nk) return;
    const key = `${lang}:${nk}`;
    const prev = byKey.get(key);
    if (!prev || weight > prev.weight) byKey.set(key, { query: q, lang, source: src, weight });
  };

  // 1) Already-clean "Title (Year)" → keep the whole title as one candidate
  //    (preserves sequel numbers; lang decided by whether it contains CJK).
  const clean = name.match(/^\s*(.+?)\s*\((\d{4})\)\s*(?:\[[^\]]*\])?\s*$/);
  if (clean) {
    const t = clean[1].trim();
    if (t) push(t, CJK_TEST_RE.test(t) ? 'zh' : 'en', 'clean', 0.95);
  }

  // 2) General title zone
  splitToCandidates(toTitleZone(name), source, source === 'file' ? 0.6 : 0.75, push);

  return [...byKey.values()].sort((a, b) => b.weight - a.weight);
}

// --- Top-level -------------------------------------------------------------

/**
 * Extract everything usable for TMDB lookup from a messy name, plus optional
 * extra names (e.g. a sample file name) whose candidates are merged at lower
 * weight. Pure: no filesystem/network. `episodes` is left empty for the caller
 * (scanner) to populate.
 */
export function extractMedia(rawName: string, extraNames: string[] = []): ExtractResult {
  const ids = extractIds(rawName);
  const tags = parseTags(rawName);
  const yearSet = new Map<number, number>();
  extractYearCandidates(rawName).forEach((y, i) => yearSet.set(y, -i));

  const byKey = new Map<string, TitleCandidate>();
  const merge = (cands: TitleCandidate[], factor: number) => {
    for (const c of cands) {
      const key = `${c.lang}:${normKey(c.query)}`;
      const weight = c.weight * factor;
      const prev = byKey.get(key);
      if (!prev || weight > prev.weight) byKey.set(key, { ...c, weight });
    }
  };

  merge(extractTitleCandidates(rawName, 'dir'), 1);
  for (const n of extraNames) {
    merge(extractTitleCandidates(n, 'file'), 0.9);
    extractYearCandidates(n).forEach((y) => {
      if (!yearSet.has(y)) yearSet.set(y, -100);
    });
  }

  const titleCandidates = [...byKey.values()].sort((a, b) => b.weight - a.weight);
  const yearCandidates = [...yearSet.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);
  const tvHint = hasEpisodeHint(rawName) || extraNames.some(hasEpisodeHint);

  return {
    ids,
    mediaType: tvHint ? 'tv' : 'unknown',
    season: extractSeasonHint(rawName) ?? extraNames.map(extractSeasonHint).find((s) => s != null),
    episodes: [],
    tags,
    titleCandidates,
    yearCandidates,
    originalName: rawName,
  };
}
