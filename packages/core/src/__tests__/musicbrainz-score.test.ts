import { describe, it, expect } from 'vitest';
import { scoreRelease } from '../musicbrainz/score.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import type { ParsedAlbum } from '../types/media.js';

const album: ParsedAlbum = {
  albumArtist: 'David Bowie',
  album: 'Heroes',
  year: 1977,
  discCount: 1,
  tracks: new Array(10).fill(0).map((_, i) => ({
    originalFileName: `${i + 1}.flac`,
    extension: '.flac',
    disc: 1,
    track: i + 1,
    title: `T${i + 1}`,
  })),
  originalDirName: 'Heroes',
  sourcePath: '/m/Heroes',
};

function rel(over: Partial<MusicBrainzRelease>): MusicBrainzRelease {
  return {
    mbid: 'x',
    title: 'Heroes',
    artist: 'David Bowie',
    year: 1977,
    trackCount: 10,
    discCount: 1,
    tracks: [],
    ...over,
  };
}

describe('scoreRelease', () => {
  it('ranks the exact artist+album+year+trackcount match highest', () => {
    const exact = rel({});
    const wrongArtist = rel({ artist: 'Queen' });
    const wrongAlbum = rel({ title: 'Low' });
    const wrongYear = rel({ year: 1990 });
    expect(scoreRelease(exact, album)).toBeGreaterThan(scoreRelease(wrongArtist, album));
    expect(scoreRelease(exact, album)).toBeGreaterThan(scoreRelease(wrongAlbum, album));
    expect(scoreRelease(exact, album)).toBeGreaterThan(scoreRelease(wrongYear, album));
  });

  it('prefers the release whose track count matches', () => {
    const right = rel({ trackCount: 10 });
    const off = rel({ trackCount: 14 });
    expect(scoreRelease(right, album)).toBeGreaterThan(scoreRelease(off, album));
  });

  it('sorts a candidate list by score, best first', () => {
    const candidates = [rel({ artist: 'Queen' }), rel({ year: 1990 }), rel({})];
    const ranked = [...candidates].sort((a, b) => scoreRelease(b, album) - scoreRelease(a, album));
    expect(ranked[0].artist).toBe('David Bowie');
    expect(ranked[0].year).toBe(1977);
  });
});
