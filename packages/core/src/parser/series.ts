export interface EpisodeAssignment {
  /** Season number, or 0 when the names carry no season marker. */
  season: number;
  episode: number;
}

const VIDEO_EXT_RE = /\.(mkv|mp4|avi|wmv|mov|ts|m2ts|rmvb|flv|webm)$/i;

interface Tokenized {
  name: string;
  /** File name with every digit run replaced by \x00 (the structural skeleton). */
  skeleton: string;
  /** The digit runs, in order. */
  nums: number[];
}

function tokenize(name: string): Tokenized {
  const base = name.replace(VIDEO_EXT_RE, '');
  const nums: number[] = [];
  const skeleton = base.replace(/\d+/g, (m) => {
    nums.push(parseInt(m, 10));
    return '\x00';
  });
  return { name, skeleton, nums };
}

function extractSeason(name: string): number | null {
  const m =
    name.match(/[Ss](\d{1,2})[Ee]\d/) ||
    name.match(/[Ss]eason\s*(\d{1,2})/i) ||
    name.match(/第\s*(\d{1,2})\s*季/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Detect the episode-number pattern across a set of video file names.
 *
 * Series files share one naming template and differ mainly by an incrementing
 * number. Instead of guessing each file in isolation, we compare the whole set:
 * the numeric field that *varies across files* (and looks like a 1..N sequence)
 * is the episode, while constant numbers (resolution `2160`, a year, digits in a
 * URL…) are tags and get ignored.
 *
 * Returns a per-file {season, episode}, or `null` when there is no series
 * pattern (fewer than 2 files, or no varying numeric field) so the caller can
 * fall back to single-file parsing.
 */
export function detectSeriesEpisodes(fileNames: string[]): Map<string, EpisodeAssignment> | null {
  if (fileNames.length < 2) return null;

  const toks = fileNames.map(tokenize);

  // Group by skeleton — files of the same series share it. Posters / NFO / extras
  // have a different skeleton and fall into other groups.
  const groups = new Map<string, Tokenized[]>();
  for (const t of toks) {
    let g = groups.get(t.skeleton);
    if (!g) {
      g = [];
      groups.set(t.skeleton, g);
    }
    g.push(t);
  }

  let group: Tokenized[] = [];
  for (const g of groups.values()) if (g.length > group.length) group = g;
  if (group.length < 2) return null;

  const numCount = group[0].nums.length;
  if (numCount === 0) return null;

  // Pick the numeric position that best looks like an episode field:
  // many distinct values, near-continuous (1..N). Constant positions are tags.
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < numCount; i++) {
    const values = group.map((t) => t.nums[i]);
    const distinct = new Set(values).size;
    if (distinct < 2) continue; // constant → a tag, not the episode
    const min = Math.min(...values);
    const max = Math.max(...values);
    const continuity = distinct / (max - min + 1); // 1 = perfectly continuous
    // distinct count dominates; continuity breaks ties; earlier position wins last.
    const score = distinct * 100 + continuity * 10 - i;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0) return null;

  // Season from a fixed S{N} / 第{N}季 marker if any file has one, else unknown (0).
  const seasons = group
    .map((t) => extractSeason(t.name))
    .filter((s): s is number => s != null);
  const season = seasons.length ? seasons[0] : 0;

  const result = new Map<string, EpisodeAssignment>();
  for (const t of group) {
    result.set(t.name, { season, episode: t.nums[best] });
  }
  return result;
}
