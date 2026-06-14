import { describe, it, expect } from 'vitest';
import {
  extractMedia,
  extractIds,
  extractYearCandidates,
} from '../parser/extract.js';
import { parseSeasonEpisode } from '../parser/file-parser.js';

describe('extractIds', () => {
  it('extracts tmdb / imdb / tvdb / douban ids', () => {
    expect(extractIds('Show (2020) [tmdbid-1399]').tmdb).toBe(1399);
    expect(extractIds('Movie (2009) [imdbid-tt0499549]').imdb).toBe('tt0499549');
    expect(extractIds('Show [tvdbid-12345]').tvdb).toBe(12345);
    expect(extractIds('片名 [doubanid-26387939]').douban).toBe(26387939);
  });
  it('returns empty when no ids', () => {
    expect(extractIds('沙丘 2024 2160p')).toEqual({});
  });
});

describe('extractYearCandidates', () => {
  it('prefers a parenthesized year', () => {
    expect(extractYearCandidates('Blade Runner 2049 (1982)')[0]).toBe(1982);
  });
  it('prefers a year sitting right before the tag block', () => {
    expect(extractYearCandidates('沙丘.2024.2160p.WEB-DL')[0]).toBe(2024);
  });
  it('still surfaces in-title numbers as lower-ranked candidates', () => {
    const ys = extractYearCandidates('2012.2009.1080p');
    expect(ys).toContain(2009);
    expect(ys).toContain(2012);
    expect(ys[0]).toBe(2009); // near the tag block
  });
  it('ignores out-of-range numbers', () => {
    expect(extractYearCandidates('Title 1234 9999')).toEqual([]);
  });
});

describe('extractMedia – title candidates', () => {
  it('clean English title stays English (not dumped into Chinese)', () => {
    const r = extractMedia('Avatar (2009)');
    const zh = r.titleCandidates.find((c) => c.lang === 'zh');
    const en = r.titleCandidates.find((c) => c.lang === 'en');
    expect(zh).toBeUndefined();
    expect(en?.query).toBe('Avatar');
  });

  it('keeps sequel number on a clean Chinese title', () => {
    const r = extractMedia('沙丘2 (2024) [tmdbid-811887]');
    expect(r.titleCandidates[0].query).toBe('沙丘2');
    expect(r.ids.tmdb).toBe(811887);
    expect(r.yearCandidates[0]).toBe(2024);
  });

  it('splits a messy mixed name into zh + en candidates', () => {
    const r = extractMedia(
      "【高清影视之家发布 www.BBEBBB.com】我，许可[杜比视界版本][高码版][国语音轨].It's.OK.2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.3Audios-PandaQT",
    );
    const queries = r.titleCandidates.map((c) => c.query);
    expect(queries).toContain('我，许可');
    expect(queries).toContain("It's OK");
    expect(r.yearCandidates[0]).toBe(2025);
  });

  it('drops Chinese metadata segments', () => {
    const r = extractMedia(
      '【高清剧集网】低智商犯罪[杜比视界版本][全24集][国语音轨+简繁英字幕].2026.2160p.IQ.WEB-DL.H265.DV-BlackTV',
    );
    const queries = r.titleCandidates.map((c) => c.query);
    expect(queries).toContain('低智商犯罪');
    expect(queries.some((q) => /全24集|字幕|音轨/.test(q))).toBe(false);
    expect(r.ids).toEqual({});
  });

  it('does not leak file extension or release group from file names', () => {
    const r = extractMedia('繁花 (2023)', [
      '繁花.Blossoms.Shanghai.S01E01.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
    ]);
    const queries = r.titleCandidates.map((c) => c.query.toLowerCase());
    expect(queries.some((q) => q.includes('mkv'))).toBe(false);
    expect(queries.some((q) => q.includes('group'))).toBe(false);
  });
});

describe('parseSeasonEpisode', () => {
  it('parses standard S01E01', () => {
    expect(parseSeasonEpisode('Show.S01E01.mkv')).toEqual({ season: 1, episodes: [1] });
  });
  it('parses 3-digit episodes (long-running shows)', () => {
    expect(parseSeasonEpisode('Anime.S01E120.mkv')).toEqual({ season: 1, episodes: [120] });
  });
  it('does not read resolution as an episode range', () => {
    expect(parseSeasonEpisode('Show.S01E01-1080p.mkv')).toEqual({ season: 1, episodes: [1] });
  });
  it('parses an episode range', () => {
    expect(parseSeasonEpisode('Show.S01E01-E03.mkv')).toEqual({ season: 1, episodes: [1, 2, 3] });
  });
  it('parses multi-episode S01E01E02', () => {
    expect(parseSeasonEpisode('Show.S01E01E02.mkv')).toEqual({ season: 1, episodes: [1, 2] });
  });
  it('parses 1x05', () => {
    expect(parseSeasonEpisode('Show.1x05.mkv')).toEqual({ season: 1, episodes: [5] });
  });
  it('parses Chinese 第05集 (season unknown)', () => {
    expect(parseSeasonEpisode('剧名.第05集.mkv')).toEqual({ season: 0, episodes: [5] });
  });
  it('returns empty for a movie file', () => {
    expect(parseSeasonEpisode('Dune.Part.Two.2024.2160p.mkv')).toEqual({ season: 0, episodes: [] });
  });
});
