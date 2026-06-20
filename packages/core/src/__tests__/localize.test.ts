import { describe, it, expect } from 'vitest';
import { convertText, hasHan } from '../musicbrainz/localize.js';
import { scoreRelease } from '../musicbrainz/score.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import type { ParsedAlbum } from '../types/media.js';

describe('hasHan', () => {
  it('detects Han characters', () => {
    expect(hasHan('说好不哭')).toBe(true);
    expect(hasHan("Won't Cry")).toBe(false);
    expect(hasHan(undefined)).toBe(false);
  });
});

describe('convertText (OpenCC)', () => {
  it('converts Traditional to Simplified', async () => {
    expect(await convertText('說好不哭', 'zh-Hans')).toBe('说好不哭');
    expect(await convertText('念念有詞', 'zh-Hans')).toBe('念念有词');
  });
  it('leaves non-Chinese text untouched', async () => {
    expect(await convertText("Won't Cry", 'zh-Hans')).toBe("Won't Cry");
  });
});

describe('scoreRelease — language preference', () => {
  const album: ParsedAlbum = {
    albumArtist: 'Jay Chou',
    album: '说好不哭',
    year: 2019,
    discCount: 1,
    tracks: [{ originalFileName: 'a.flac', extension: '.flac', disc: 1, track: 1, title: 'x' }],
    originalDirName: 'Jay Chou - Won\'t Cry',
    sourcePath: '/m',
  };
  const rel = (over: Partial<MusicBrainzRelease>): MusicBrainzRelease => ({
    mbid: 'x', title: '', artist: 'Jay Chou', year: 2019, trackCount: 1, discCount: 1, tracks: [], ...over,
  });

  it('prefers a Chinese-titled release over an English one when preferLang=zh', () => {
    const chinese = rel({ title: '说好不哭' });
    const english = rel({ title: "Won't Cry" });
    expect(scoreRelease(chinese, album, [], 'zh')).toBeGreaterThan(scoreRelease(english, album, [], 'zh'));
  });
});
