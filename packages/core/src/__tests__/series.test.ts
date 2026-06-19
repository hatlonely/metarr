import { describe, it, expect } from 'vitest';
import { detectSeriesEpisodes } from '../parser/series.js';

describe('detectSeriesEpisodes', () => {
  it('reads the bare leading number, ignoring constant tags (2160 / url digits)', () => {
    const names = Array.from(
      { length: 5 },
      (_, i) => `${String(i + 1).padStart(2, '0')}.2160p.HD国语中字[www.dyg7.com].mkv`,
    );
    const m = detectSeriesEpisodes(names);
    expect(m).not.toBeNull();
    expect(m!.get('01.2160p.HD国语中字[www.dyg7.com].mkv')).toEqual({ season: 0, episode: 1 });
    expect(m!.get('05.2160p.HD国语中字[www.dyg7.com].mkv')).toEqual({ season: 0, episode: 5 });
    expect(m!.size).toBe(5);
  });

  it('uses the varying E field and reads season from the S marker', () => {
    const names = ['Show.S01E01.1080p.mkv', 'Show.S01E02.1080p.mkv', 'Show.S01E03.1080p.mkv'];
    const m = detectSeriesEpisodes(names);
    expect(m!.get('Show.S01E02.1080p.mkv')).toEqual({ season: 1, episode: 2 });
  });

  it('handles a mid-name episode number (剧名.NN.标签)', () => {
    const names = ['雨霖铃.01.2160p.mkv', '雨霖铃.02.2160p.mkv', '雨霖铃.03.2160p.mkv'];
    const m = detectSeriesEpisodes(names);
    expect(m!.get('雨霖铃.02.2160p.mkv')).toEqual({ season: 0, episode: 2 });
  });

  it('only assigns the matching template group (drops odd files)', () => {
    const names = ['01.x.mkv', '02.x.mkv', '03.x.mkv', 'trailer.mkv'];
    const m = detectSeriesEpisodes(names);
    expect(m!.size).toBe(3);
    expect(m!.has('trailer.mkv')).toBe(false);
  });

  it('returns null for a single file', () => {
    expect(detectSeriesEpisodes(['movie.2024.2160p.mkv'])).toBeNull();
  });

  it('returns null when no numeric field varies', () => {
    expect(detectSeriesEpisodes(['x.2160p.mkv', 'x.2160p.mp4'])).toBeNull();
  });
});
