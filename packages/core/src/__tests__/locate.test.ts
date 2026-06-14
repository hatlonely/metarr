import { describe, it, expect } from 'vitest';
import { locate } from '../tmdb/locate.js';
import type { TMDBClient } from '../tmdb/client.js';
import type { ExtractResult, TitleCandidate } from '../types/media.js';
import type { TMDBMatch } from '../types/tmdb.js';

interface Call {
  query: string;
  type: 'tv' | 'movie';
  year?: number;
}

/** Fake client recording every search; `search(query, year)` decides results. */
function recordingClient(
  calls: Call[],
  search?: (query: string, year?: number) => TMDBMatch[],
): TMDBClient {
  return {
    search: async (query: string, type: 'tv' | 'movie', year?: number) => {
      calls.push({ query, type, year });
      return search ? search(query, year) : [];
    },
    getByTmdbId: async () => [],
    findByExternalId: async () => [],
  } as unknown as TMDBClient;
}

function extract(p: Partial<ExtractResult>): ExtractResult {
  return {
    ids: {},
    mediaType: 'unknown',
    episodes: [],
    tags: {},
    titleCandidates: [],
    yearCandidates: [],
    originalName: '',
    ...p,
  };
}

const cand = (query: string, weight = 0.8): TitleCandidate => ({
  query,
  lang: 'zh',
  source: 'dir',
  weight,
});

const result = (id: number): TMDBMatch => ({
  id,
  type: 'tv',
  displayName: '繁花',
  originalName: '',
  year: 2023,
  overview: '',
});

describe('locate – exact-first then fuzzy fallback', () => {
  it('uses only the exact "title + year" search when it returns results', async () => {
    const calls: Call[] = [];
    const client = recordingClient(calls, (_q, year) => (year ? [result(1)] : []));
    const r = await locate(client, extract({ titleCandidates: [cand('繁花')], yearCandidates: [2023] }), {
      type: 'tv',
    });
    // exact pass hit → no fuzzy (no-year) query should be issued
    expect(calls).toEqual([{ query: '繁花', type: 'tv', year: 2023 }]);
    expect(r).toHaveLength(1);
    expect(r[0].matchReason).toBe('最佳匹配');
  });

  it('falls back to a fuzzy "title alone" search when the exact pass is empty', async () => {
    const calls: Call[] = [];
    const client = recordingClient(calls, (_q, year) => (year ? [] : [result(2)]));
    const r = await locate(client, extract({ titleCandidates: [cand('繁花')], yearCandidates: [2023] }), {
      type: 'tv',
    });
    expect(calls).toContainEqual({ query: '繁花', type: 'tv', year: 2023 }); // exact attempt
    expect(calls).toContainEqual({ query: '繁花', type: 'tv', year: undefined }); // fallback
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(2);
  });

  it('searches title alone directly when there is no year', async () => {
    const calls: Call[] = [];
    await locate(recordingClient(calls), extract({ titleCandidates: [cand('繁花')] }), { type: 'tv' });
    expect(calls).toEqual([{ query: '繁花', type: 'tv', year: undefined }]);
  });

  it('merges duplicate ids across candidate queries and marks the top match', async () => {
    const calls: Call[] = [];
    // two candidates both resolve to the same id 1 in the exact pass
    const client = recordingClient(calls, (_q, year) => (year ? [result(1)] : []));
    const r = await locate(
      client,
      extract({ titleCandidates: [cand('繁花', 0.9), cand('Blossoms', 0.7)], yearCandidates: [2023] }),
      { type: 'tv' },
    );
    expect(r).toHaveLength(1);
    expect(r[0].matchReason).toBe('最佳匹配');
  });
});
