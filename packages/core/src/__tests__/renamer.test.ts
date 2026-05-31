import { describe, it, expect } from 'vitest';
import type { ParsedMedia } from '../types/media.js';
import type { TMDBMatch, RenameOptions } from '../types/renamer.js';
import { generateRenamePlan } from '../renamer/index.js';

const baseParsedMedia: ParsedMedia = {
  type: 'tv',
  chineseTitle: '低智商犯罪',
  englishTitle: 'Born with Luck',
  year: 2026,
  tags: { resolution: '2160p', codec: 'H.265' },
  episodes: [
    {
      originalFileName: 'Born.with.Luck.S01E01.2026.2160p.IQ.WEB-DL.H265.DV.DDP5.1-BlackTV.mkv',
      extension: '.mkv',
      season: 1,
      episodes: [1],
      tags: {},
      associatedFiles: [],
    },
    {
      originalFileName: 'Born.with.Luck.S01E02.2026.2160p.IQ.WEB-DL.H265.DV.DDP5.1-BlackTV.mkv',
      extension: '.mkv',
      season: 1,
      episodes: [2],
      tags: {},
      associatedFiles: [],
    },
  ],
  originalDirName: 'test-dir',
  sourcePath: '/tmp/test-source',
  isClean: false,
};

const baseTmdbMatch: TMDBMatch = {
  id: 12345,
  type: 'tv',
  displayName: '低智商犯罪',
  originalName: 'Born with Luck',
  year: 2026,
  overview: 'A crime drama.',
};

const baseOptions: RenameOptions = {
  destPath: '/tmp/test-dest',
  preferImdbId: true,
};

describe('generateRenamePlan (tv)', () => {
  it('should generate correct plan for TV show', () => {
    const plan = generateRenamePlan(baseParsedMedia, baseTmdbMatch, baseOptions);

    expect(plan.mediaType).toBe('tv');
    expect(plan.tasks.length).toBe(4); // 1 root dir + 1 season dir + 2 file renames
    expect(plan.tasks[0].operation).toBe('create-dir');
    expect(plan.tasks[0].target).toContain('低智商犯罪 (2026) [tmdbid-12345]');
    expect(plan.tasks[1].operation).toBe('create-dir');
    expect(plan.tasks[1].target).toContain('Season 01');
    expect(plan.tasks[2].operation).toBe('rename');
    expect(plan.tasks[2].target).toContain('低智商犯罪 (2026) S01E01.mkv');
    expect(plan.tasks[3].target).toContain('低智商犯罪 (2026) S01E02.mkv');
  });

  it('should fallback to originalName when displayName is empty', () => {
    const noDisplayName = { ...baseTmdbMatch, displayName: '' };
    const plan = generateRenamePlan(baseParsedMedia, noDisplayName, baseOptions);

    expect(plan.tasks[0].target).toContain('Born with Luck (2026) [tmdbid-12345]');
    expect(plan.tasks[2].target).toContain('Born with Luck (2026) S01E01.mkv');
  });
});

describe('generateRenamePlan (movie)', () => {
  const movieParsed: ParsedMedia = {
    ...baseParsedMedia,
    type: 'movie',
    episodes: [
      {
        originalFileName: 'Movie.2026.2160p.BluRay.REMUX.HEVC.TrueHD-Group.mkv',
        extension: '.mkv',
        season: 0,
        episodes: [],
        tags: {},
        associatedFiles: [],
      },
    ],
  };

  const movieMatch: TMDBMatch = {
    ...baseTmdbMatch,
    type: 'movie',
    imdbId: 'tt1234567',
  };

  it('should generate plan using imdbid when available', () => {
    const plan = generateRenamePlan(movieParsed, movieMatch, baseOptions);

    expect(plan.mediaType).toBe('movie');
    expect(plan.tasks.length).toBe(2); // 1 root dir + 1 file rename
    expect(plan.tasks[0].target).toContain('[imdbid-tt1234567]');
    expect(plan.tasks[1].target).toContain('[imdbid-tt1234567]');
  });

  it('should fallback to tmdbid when no imdbId', () => {
    const noImdbMatch = { ...movieMatch, imdbId: undefined };
    const plan = generateRenamePlan(movieParsed, noImdbMatch, baseOptions);

    expect(plan.tasks[0].target).toContain('[tmdbid-12345]');
  });

  it('should use tmdbid when preferImdbId is false', () => {
    const plan = generateRenamePlan(movieParsed, movieMatch, {
      ...baseOptions,
      preferImdbId: false,
    });

    expect(plan.tasks[0].target).toContain('[tmdbid-12345]');
  });

  it('should rename associated subtitle files', () => {
    const movieWithSubs: ParsedMedia = {
      ...movieParsed,
      episodes: [
        {
          ...movieParsed.episodes[0],
          associatedFiles: ['Movie.2026.zh.srt'],
        },
      ],
    };

    const plan = generateRenamePlan(movieWithSubs, movieMatch, baseOptions);

    expect(plan.tasks.length).toBe(3); // dir + movie + subtitle
    expect(plan.tasks[2].operation).toBe('rename');
    expect(plan.tasks[2].target).toContain('.zh.srt');
  });
});
