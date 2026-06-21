import { describe, it, expect } from 'vitest';
import { assessVideo, assessMusic } from '../batch/confidence.js';
import type { TMDBMatch } from '../types/tmdb.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';

const tv = (over: Partial<TMDBMatch>): TMDBMatch => ({
  id: 1, type: 'movie', displayName: 'X', originalName: 'X', year: 2020, overview: '', ...over,
});
const rel = (over: Partial<MusicBrainzRelease>): MusicBrainzRelease => ({
  mbid: 'm', title: 'A', artist: 'B', year: 2020, trackCount: 10, discCount: 1, tracks: [], ...over,
});

describe('assessVideo', () => {
  it('none when no candidates', () => {
    expect(assessVideo([], {}).level).toBe('none');
  });
  it('high on ID hit regardless of score', () => {
    expect(assessVideo([tv({ matchReason: 'TMDB ID 命中', matchScore: 1000 })], {}).level).toBe('high');
  });
  it('high when score + gap + year all good', () => {
    const m = [tv({ matchScore: 70, year: 2020 }), tv({ id: 2, matchScore: 40 })];
    expect(assessVideo(m, { year: 2020 }).level).toBe('high');
  });
  it('low on year mismatch', () => {
    const m = [tv({ matchScore: 70, year: 1990 }), tv({ id: 2, matchScore: 40 })];
    expect(assessVideo(m, { year: 2020 })).toMatchObject({ level: 'low', reason: 'year-mismatch' });
  });
  it('low when ambiguous (small gap)', () => {
    const m = [tv({ matchScore: 70 }), tv({ id: 2, matchScore: 65 })];
    expect(assessVideo(m, {}).level).toBe('low');
  });
});

describe('assessMusic', () => {
  it('none when no candidates', () => {
    expect(assessMusic([], { trackCount: 10 }).level).toBe('none');
  });
  it('high on strong score with matching year + track count', () => {
    expect(assessMusic([rel({ matchScore: 100 })], { year: 2020, trackCount: 10 }).level).toBe('high');
  });
  it('low on a generic-title wrong match (mid score, year off)', () => {
    const m = [rel({ matchScore: 64, year: 2021 })];
    expect(assessMusic(m, { year: 2000, trackCount: 12 }).level).toBe('low');
  });
});
