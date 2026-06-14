import type { TitleCandidate } from '../types/media.js';
import type { TMDBMatch } from '../types/tmdb.js';

/** Normalize for comparison: lowercase, drop whitespace and punctuation. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\p{P}]/gu, '');
}

function bigrams(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    m.set(bg, (m.get(bg) ?? 0) + 1);
  }
  return m;
}

/** Sørensen–Dice coefficient on character bigrams, in [0,1]. */
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const ba = bigrams(a);
  const bb = bigrams(b);
  let overlap = 0;
  for (const [bg, c] of ba) {
    const d = bb.get(bg);
    if (d) overlap += Math.min(c, d);
  }
  return (2 * overlap) / (a.length - 1 + (b.length - 1));
}

function sim(q: string, t: string): number {
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (q.includes(t) || t.includes(q)) return 0.85;
  return dice(q, t);
}

/** Best similarity of the query against a result's display or original name. */
export function titleSimilarity(query: string, displayName: string, originalName: string): number {
  const q = norm(query);
  return Math.max(sim(q, norm(displayName)), sim(q, norm(originalName)));
}

export interface ScoreContext {
  year?: number;
  type?: 'tv' | 'movie';
}

/**
 * Relevance score for a TMDB result against the candidate that produced it.
 * Higher = better. Factors: source prior + title similarity + year match +
 * type match + popularity tie-break.
 */
export function scoreMatch(
  match: TMDBMatch,
  cand: TitleCandidate | undefined,
  ctx: ScoreContext,
): number {
  let score = 0;
  score += (cand?.weight ?? 0.5) * 20; // source prior
  score += titleSimilarity(cand?.query ?? match.displayName, match.displayName, match.originalName) * 40;
  if (ctx.year && match.year) {
    const d = Math.abs(ctx.year - match.year);
    score += d === 0 ? 20 : d === 1 ? 8 : -12;
  }
  if (ctx.type && match.type === ctx.type) score += 8;
  score += Math.min((match.popularity ?? 0) / 50, 1) * 5; // tie-breaker
  return Math.round(score * 100) / 100;
}
