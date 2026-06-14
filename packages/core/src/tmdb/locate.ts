import type { ExtractResult, TitleCandidate } from '../types/media.js';
import type { TMDBMatch } from '../types/tmdb.js';
import type { TMDBClient } from './client.js';
import { scoreMatch } from './score.js';

export interface LocateOptions {
  /** Force a media type; omit/auto to search both as needed. */
  type?: 'tv' | 'movie';
  /** Preferred year (defaults to the top year candidate). */
  year?: number;
  /** Max number of search queries per pass (default 6). */
  limit?: number;
}

interface Query {
  query: string;
  type: 'tv' | 'movie';
  year?: number;
  cand: TitleCandidate;
}

function resolveTypes(
  extract: ExtractResult,
  type: 'tv' | 'movie' | undefined,
): ('tv' | 'movie')[] {
  if (type) return [type];
  if (extract.mediaType === 'tv') return ['tv'];
  if (extract.mediaType === 'movie') return ['movie'];
  return ['movie', 'tv'];
}

/** One pass of queries: each candidate × type, all using the same `searchYear`. */
function buildQueries(
  extract: ExtractResult,
  types: ('tv' | 'movie')[],
  searchYear: number | undefined,
  limit: number,
): Query[] {
  const cands = extract.titleCandidates.slice(0, 3);
  const seen = new Set<string>();
  const queries: Query[] = [];
  for (const c of cands) {
    for (const t of types) {
      if (queries.length >= limit) return queries;
      const key = `${t}|${c.query.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queries.push({ query: c.query, type: t, year: searchYear, cand: c });
    }
  }
  return queries;
}

/** Run queries concurrently, merge by TMDB id (best score wins), rank. */
async function runQueries(
  client: TMDBClient,
  queries: Query[],
  scoreYear: number | undefined,
  scoreType: 'tv' | 'movie' | undefined,
): Promise<TMDBMatch[]> {
  if (queries.length === 0) return [];
  const settled = await Promise.all(
    queries.map((q) => client.search(q.query, q.type, q.year).catch(() => [] as TMDBMatch[])),
  );

  const byId = new Map<number, TMDBMatch>();
  settled.forEach((results, qi) => {
    const q = queries[qi];
    for (const r of results) {
      const s = scoreMatch(r, q.cand, { year: scoreYear, type: scoreType ?? q.type });
      const prev = byId.get(r.id);
      if (!prev || (prev.matchScore ?? -Infinity) < s) byId.set(r.id, { ...r, matchScore: s });
    }
  });

  const ranked = [...byId.values()].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
  if (ranked[0]) ranked[0].matchReason = '最佳匹配';
  return ranked;
}

/**
 * Turn an {@link ExtractResult} into ranked TMDB matches.
 *
 * Strategy:
 *  1. ID hit (tmdb / imdb) → direct lookup, short-circuit.
 *  2. Exact pass: "title + year" for each candidate. If it yields anything,
 *     return it — the precise result wins.
 *  3. Fallback pass: only when the exact pass is empty (or there is no year),
 *     search by "title alone" (fuzzy) and rank those.
 */
export async function locate(
  client: TMDBClient,
  extract: ExtractResult,
  opts: LocateOptions = {},
): Promise<TMDBMatch[]> {
  const limit = opts.limit ?? 6;
  const year = opts.year ?? extract.yearCandidates[0];
  const typeHint = opts.type ?? (extract.mediaType !== 'unknown' ? extract.mediaType : undefined);
  const types = resolveTypes(extract, opts.type);

  // 1) Direct ID lookup — highest confidence.
  if (extract.ids.tmdb) {
    const m = await client.getByTmdbId(extract.ids.tmdb, typeHint);
    if (m.length) return m.map((x) => ({ ...x, matchScore: 1000, matchReason: 'TMDB ID 命中' }));
  }
  if (extract.ids.imdb) {
    const m = await client.findByExternalId(extract.ids.imdb);
    if (m.length) return m.map((x) => ({ ...x, matchScore: 1000, matchReason: 'IMDB ID 命中' }));
  }

  // 2) Exact pass: title + year.
  if (year !== undefined) {
    const exact = await runQueries(client, buildQueries(extract, types, year, limit), year, opts.type);
    if (exact.length) return exact;
  }

  // 3) Fallback pass: title alone (fuzzy).
  return runQueries(client, buildQueries(extract, types, undefined, limit), year, opts.type);
}
