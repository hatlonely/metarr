import { describe, it, expect } from 'vitest';
import {
  aggregateAlbum,
  fallbackFromName,
  isAlbumComplete,
  parseDiscNo,
  parseAlbumDirName,
  type TrackInput,
} from '../parser/audio-parser.js';

function tagged(name: string, tags: TrackInput['tags']): TrackInput {
  return { name, extension: name.slice(name.lastIndexOf('.')), tags };
}

describe('fallbackFromName', () => {
  it('extracts a leading track number and title', () => {
    expect(fallbackFromName('01 - Black Star.flac')).toEqual({ track: 1, title: 'Black Star' });
    expect(fallbackFromName('07. Heroes.mp3')).toEqual({ track: 7, title: 'Heroes' });
    expect(fallbackFromName('12 Let It Be.m4a')).toEqual({ track: 12, title: 'Let It Be' });
  });

  it('falls back to the bare name when there is no leading number', () => {
    expect(fallbackFromName('Intro.flac')).toEqual({ title: 'Intro' });
  });
});

describe('aggregateAlbum', () => {
  it('aggregates embedded tags, picking the dominant album artist / album / year', () => {
    const album = aggregateAlbum('/music/Bowie - Heroes', [
      tagged('a.flac', { albumartist: 'David Bowie', album: 'Heroes', year: 1977, title: 'Beauty', track: { no: 2 } }),
      tagged('b.flac', { albumartist: 'David Bowie', album: 'Heroes', year: 1977, title: 'Heroes', track: { no: 1 } }),
    ]);
    expect(album.albumArtist).toBe('David Bowie');
    expect(album.album).toBe('Heroes');
    expect(album.year).toBe(1977);
    expect(album.discCount).toBe(1);
    // sorted by track number
    expect(album.tracks.map((t) => t.track)).toEqual([1, 2]);
    expect(album.tracks[0].title).toBe('Heroes');
  });

  it('falls back to filename for track/title and to dirname for album', () => {
    const album = aggregateAlbum('/music/Some Album', [
      tagged('02 - Second.mp3', null),
      tagged('01 - First.mp3', null),
    ]);
    expect(album.album).toBe('Some Album'); // from dirname
    expect(album.albumArtist).toBeUndefined();
    expect(album.tracks.map((t) => t.track)).toEqual([1, 2]);
    expect(album.tracks.map((t) => t.title)).toEqual(['First', 'Second']);
  });

  it('tracks disc count from multi-disc tags and sorts by disc then track', () => {
    const album = aggregateAlbum('/music/Box Set', [
      tagged('d2t1.flac', { album: 'Box', title: 'X', track: { no: 1 }, disk: { no: 2 } }),
      tagged('d1t1.flac', { album: 'Box', title: 'A', track: { no: 1 }, disk: { no: 1 } }),
    ]);
    expect(album.discCount).toBe(2);
    expect(album.tracks.map((t) => [t.disc, t.track])).toEqual([
      [1, 1],
      [2, 1],
    ]);
  });
});

describe('parseDiscNo', () => {
  it('reads a disc number from common subdir names', () => {
    expect(parseDiscNo('Disc 01')).toBe(1);
    expect(parseDiscNo('Disc 2')).toBe(2);
    expect(parseDiscNo('CD1')).toBe(1);
    expect(parseDiscNo('Disc 2 - AVCD')).toBe(2);
    expect(parseDiscNo('Disc 1 旅程')).toBe(1);
    expect(parseDiscNo('Artwork')).toBeUndefined();
  });
});

describe('aggregateAlbum — multi-disc subdirs', () => {
  it('uses discFromDir and keeps the relative path per track', () => {
    const album = aggregateAlbum('/music/2CD', [
      { name: '01 - A.flac', extension: '.flac', relPath: 'Disc 01/01 - A.flac', discFromDir: 1, tags: { album: 'X', title: 'A', track: { no: 1 } } },
      { name: '01 - B.flac', extension: '.flac', relPath: 'Disc 02/01 - B.flac', discFromDir: 2, tags: { album: 'X', title: 'B', track: { no: 1 } } },
    ]);
    expect(album.discCount).toBe(2);
    expect(album.tracks.map((t) => [t.disc, t.track, t.relPath])).toEqual([
      [1, 1, 'Disc 01/01 - A.flac'],
      [2, 1, 'Disc 02/01 - B.flac'],
    ]);
  });
});

describe('parseAlbumDirName', () => {
  it('strips bracket prefix + quality junk and splits Artist - Album', () => {
    expect(parseAlbumDirName('[191215] 周杰伦 - 我是如此相信 24bit')).toEqual({
      artist: '周杰伦',
      album: '我是如此相信',
      year: undefined,
    });
  });

  it('extracts a standalone year and drops format tokens', () => {
    expect(parseAlbumDirName('赵雷 - 吉姆餐厅 (2014) [FLAC]')).toEqual({
      artist: '赵雷',
      album: '吉姆餐厅',
      year: 2014,
    });
  });

  it('falls back to album-only when there is no Artist - Album split', () => {
    expect(parseAlbumDirName('SomeAlbum')).toEqual({ album: 'SomeAlbum', year: undefined });
  });

  it('handles scene-style dot/underscore separators and a leading year', () => {
    expect(parseAlbumDirName('2019.-.林俊杰.-.Wonderland[FLAC]')).toEqual({
      artist: '林俊杰',
      album: 'Wonderland',
      year: 2019,
    });
  });
});

describe('aggregateAlbum — dirname fallback (untagged files)', () => {
  it('fills artist/album from the folder name and strips the artist from the title', () => {
    const album = aggregateAlbum('/m/[191215] 周杰伦 - 我是如此相信 24bit', [
      { name: '周杰伦 - 我是如此相信.flac', extension: '.flac', tags: { year: 2019 } },
    ]);
    expect(album.albumArtist).toBe('周杰伦');
    expect(album.album).toBe('我是如此相信');
    expect(album.year).toBe(2019);
    expect(album.tracks[0].title).toBe('我是如此相信');
  });
});

describe('isAlbumComplete', () => {
  const base = {
    albumArtist: 'A',
    album: 'B',
    year: 2000,
    discCount: 1,
    originalDirName: 'd',
    sourcePath: '/d',
  };

  it('is complete when artist, album and every track has title + number', () => {
    expect(
      isAlbumComplete({
        ...base,
        tracks: [{ originalFileName: 'a.flac', extension: '.flac', disc: 1, track: 1, title: 'T' }],
      }),
    ).toBe(true);
  });

  it('is incomplete when a track lacks a number or title, or artist is missing', () => {
    expect(
      isAlbumComplete({
        ...base,
        tracks: [{ originalFileName: 'a.flac', extension: '.flac', disc: 1, title: 'T' }],
      }),
    ).toBe(false);
    expect(
      isAlbumComplete({
        ...base,
        albumArtist: undefined,
        tracks: [{ originalFileName: 'a.flac', extension: '.flac', disc: 1, track: 1, title: 'T' }],
      }),
    ).toBe(false);
  });
});
