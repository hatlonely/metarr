import { describe, it, expect } from 'vitest';
import { generateMusicRenamePlan } from '../renamer/music-renamer.js';
import type { ParsedAlbum } from '../types/media.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';

function album(over: Partial<ParsedAlbum> = {}): ParsedAlbum {
  return {
    albumArtist: 'David Bowie',
    album: 'Heroes',
    year: 1977,
    discCount: 1,
    sourcePath: '/music/incoming/bowie heroes',
    originalDirName: 'bowie heroes',
    tracks: [
      { originalFileName: 'track2.flac', extension: '.flac', disc: 1, track: 2, title: 'Beauty and the Beast' },
      { originalFileName: 'track1.flac', extension: '.flac', disc: 1, track: 1, title: 'Heroes' },
    ],
    ...over,
  };
}

describe('generateMusicRenamePlan — local tags (no release)', () => {
  it('organizes into Artist/Album (Year)/NN - Title', () => {
    const plan = generateMusicRenamePlan(album(), null, { destPath: '/library' });
    expect(plan.mediaType).toBe('music');
    expect(plan.tasks[0]).toMatchObject({ operation: 'create-dir' });
    expect(plan.tasks[0].target).toBe('/library/David Bowie/Heroes (1977)');
    const renames = plan.tasks.filter((t) => t.operation === 'rename');
    expect(renames.map((t) => t.target)).toEqual([
      '/library/David Bowie/Heroes (1977)/01 - Heroes.flac',
      '/library/David Bowie/Heroes (1977)/02 - Beauty and the Beast.flac',
    ]);
    expect(plan.mediaSummary).toMatchObject({ name: 'Heroes', originalName: 'David Bowie', type: 'music' });
  });

  it('empty destPath organizes next to the source folder', () => {
    const plan = generateMusicRenamePlan(album(), null, { destPath: '' });
    expect(plan.destPath).toBe('/music/incoming');
    expect(plan.tasks[0].target).toBe('/music/incoming/David Bowie/Heroes (1977)');
  });

  it('assigns sequential track numbers when tags lack them', () => {
    const a = album({
      tracks: [
        { originalFileName: 'b.flac', extension: '.flac', disc: 1, title: 'Second' },
        { originalFileName: 'a.flac', extension: '.flac', disc: 1, title: 'First' },
      ],
    });
    const plan = generateMusicRenamePlan(a, null, { destPath: '/library' });
    const renames = plan.tasks.filter((t) => t.operation === 'rename');
    // sorted by filename (no track no), then numbered 1,2
    expect(renames.map((t) => t.target)).toEqual([
      '/library/David Bowie/Heroes (1977)/01 - First.flac',
      '/library/David Bowie/Heroes (1977)/02 - Second.flac',
    ]);
  });
});

describe('generateMusicRenamePlan — with MusicBrainz release', () => {
  const release: MusicBrainzRelease = {
    mbid: 'mb1',
    title: '"Heroes"',
    artist: 'David Bowie',
    year: 1977,
    trackCount: 2,
    discCount: 1,
    coverUrl: 'http://caa/mb1/front',
    tracks: [
      { disc: 1, position: 1, title: '"Heroes"' },
      { disc: 1, position: 2, title: 'Beauty and the Beast' },
    ],
  };

  it('uses canonical titles + release artist/year/cover', () => {
    const plan = generateMusicRenamePlan(album(), release, { destPath: '/library' });
    expect(plan.tasks[0].target).toBe('/library/David Bowie/_Heroes_ (1977)'); // sanitized quotes
    const renames = plan.tasks.filter((t) => t.operation === 'rename');
    expect(renames[0].target).toBe('/library/David Bowie/_Heroes_ (1977)/01 - _Heroes_.flac');
    expect(plan.mediaSummary?.poster).toBe('http://caa/mb1/front');
  });
});

describe('generateMusicRenamePlan — multi-disc', () => {
  it('uses the disc-track filename pattern', () => {
    const a = album({
      discCount: 2,
      tracks: [
        { originalFileName: 'd1.flac', extension: '.flac', disc: 1, track: 1, title: 'A' },
        { originalFileName: 'd2.flac', extension: '.flac', disc: 2, track: 1, title: 'B' },
      ],
    });
    const plan = generateMusicRenamePlan(a, null, { destPath: '/library' });
    const renames = plan.tasks.filter((t) => t.operation === 'rename');
    expect(renames.map((t) => t.target)).toEqual([
      '/library/David Bowie/Heroes (1977)/1-01 - A.flac',
      '/library/David Bowie/Heroes (1977)/2-01 - B.flac',
    ]);
  });
});
