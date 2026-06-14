import { describe, it, expect } from 'vitest';
import { scoreMatch, titleSimilarity } from '../tmdb/score.js';
import type { TMDBMatch } from '../types/tmdb.js';
import type { TitleCandidate } from '../types/media.js';

function match(p: Partial<TMDBMatch>): TMDBMatch {
  return {
    id: 1,
    type: 'movie',
    displayName: '',
    originalName: '',
    year: 0,
    overview: '',
    ...p,
  };
}
function cand(p: Partial<TitleCandidate>): TitleCandidate {
  return { query: '', lang: 'en', source: 'dir', weight: 0.75, ...p };
}

describe('titleSimilarity', () => {
  it('is 1 for an exact (normalized) match', () => {
    expect(titleSimilarity('沙丘2', '沙丘2', 'Dune 2')).toBe(1);
    expect(titleSimilarity("It's OK", 'Its OK', '')).toBe(1);
  });
  it('rewards containment', () => {
    expect(titleSimilarity('Dune', 'Dune Part Two', '')).toBeGreaterThan(0.8);
  });
  it('is low for unrelated titles', () => {
    expect(titleSimilarity('沙丘', '繁花', '')).toBeLessThan(0.3);
  });
});

describe('scoreMatch', () => {
  it('ranks an exact title + same year above a weak partial', () => {
    const ctx = { year: 2024, type: 'movie' as const };
    const good = scoreMatch(
      match({ displayName: '沙丘2', year: 2024, type: 'movie', popularity: 50 }),
      cand({ query: '沙丘2', lang: 'zh', weight: 0.95 }),
      ctx,
    );
    const weak = scoreMatch(
      match({ displayName: '沙丘 (旧片)', year: 1984, type: 'movie' }),
      cand({ query: '沙丘2', lang: 'zh', weight: 0.95 }),
      ctx,
    );
    expect(good).toBeGreaterThan(weak);
  });

  it('penalizes a far-off year', () => {
    const base = match({ displayName: 'Dune', year: 2024, type: 'movie' });
    const c = cand({ query: 'Dune' });
    expect(scoreMatch(base, c, { year: 2024 })).toBeGreaterThan(
      scoreMatch(match({ displayName: 'Dune', year: 1984, type: 'movie' }), c, { year: 2024 }),
    );
  });
});
