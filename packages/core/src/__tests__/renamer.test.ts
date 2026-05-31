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

const universalOptions: RenameOptions = {
  destPath: '/tmp/test-dest',
  preferImdbId: true,
  namingPreset: 'universal',
};

const jellyfinOptions: RenameOptions = {
  destPath: '/tmp/test-dest',
  preferImdbId: true,
  namingPreset: 'jellyfin',
};

describe('generateRenamePlan (tv) - universal preset', () => {
  it('should generate correct plan', () => {
    const plan = generateRenamePlan(baseParsedMedia, baseTmdbMatch, universalOptions);

    expect(plan.mediaType).toBe('tv');
    expect(plan.tasks.length).toBe(4);
    expect(plan.tasks[0].operation).toBe('create-dir');
    expect(plan.tasks[0].target).toContain('低智商犯罪 (2026)');
    expect(plan.tasks[0].target).not.toContain('tmdbid');
    expect(plan.tasks[1].target).toContain('Season 01');
    expect(plan.tasks[2].target).toContain('低智商犯罪 S01E01.mkv');
    expect(plan.tasks[3].target).toContain('低智商犯罪 S01E02.mkv');
  });

  it('should fallback to originalName when displayName is empty', () => {
    const noDisplayName = { ...baseTmdbMatch, displayName: '' };
    const plan = generateRenamePlan(baseParsedMedia, noDisplayName, universalOptions);

    expect(plan.tasks[0].target).toContain('Born with Luck (2026)');
    expect(plan.tasks[2].target).toContain('Born with Luck S01E01.mkv');
  });
});

describe('generateRenamePlan (tv) - jellyfin preset', () => {
  it('should include tmdbid tag in directory and year in episode file', () => {
    const plan = generateRenamePlan(baseParsedMedia, baseTmdbMatch, jellyfinOptions);

    expect(plan.tasks[0].target).toContain('低智商犯罪 (2026) [tmdbid-12345]');
    expect(plan.tasks[2].target).toContain('低智商犯罪 (2026) S01E01.mkv');
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

  it('universal: no id tag in output', () => {
    const plan = generateRenamePlan(movieParsed, movieMatch, universalOptions);

    expect(plan.mediaType).toBe('movie');
    expect(plan.tasks.length).toBe(2);
    expect(plan.tasks[0].target).toContain('低智商犯罪 (2026)');
    expect(plan.tasks[0].target).not.toContain('imdbid');
    expect(plan.tasks[1].target).toContain('低智商犯罪 (2026).mkv');
  });

  it('jellyfin: uses imdbid when available', () => {
    const plan = generateRenamePlan(movieParsed, movieMatch, jellyfinOptions);

    expect(plan.tasks[0].target).toContain('[imdbid-tt1234567]');
    expect(plan.tasks[1].target).toContain('[imdbid-tt1234567]');
  });

  it('jellyfin: fallback to tmdbid when no imdbId', () => {
    const noImdbMatch = { ...movieMatch, imdbId: undefined };
    const plan = generateRenamePlan(movieParsed, noImdbMatch, jellyfinOptions);

    expect(plan.tasks[0].target).toContain('[tmdbid-12345]');
  });

  it('jellyfin: use tmdbid when preferImdbId is false', () => {
    const plan = generateRenamePlan(movieParsed, movieMatch, {
      ...jellyfinOptions,
      preferImdbId: false,
    });

    expect(plan.tasks[0].target).toContain('[tmdbid-12345]');
  });

  it('should rename associated subtitle files', () => {
    const movieWithSubs: ParsedMedia = {
      ...movieParsed,
      episodes: [{ ...movieParsed.episodes[0], associatedFiles: ['Movie.2026.zh.srt'] }],
    };

    const plan = generateRenamePlan(movieWithSubs, movieMatch, universalOptions);

    expect(plan.tasks.length).toBe(3);
    expect(plan.tasks[2].operation).toBe('rename');
    expect(plan.tasks[2].target).toContain('.zh.srt');
  });
});

describe('generateRenamePlan (tv) - plex preset', () => {
  it('should use dash separator before episode code', () => {
    const plan = generateRenamePlan(baseParsedMedia, baseTmdbMatch, {
      ...universalOptions,
      namingPreset: 'plex',
    });

    expect(plan.tasks[2].target).toContain('低智商犯罪 - S01E01.mkv');
  });
});

describe('generateRenamePlan (tv) - kodi preset', () => {
  it('should omit year from directory and use unpadded season', () => {
    const plan = generateRenamePlan(baseParsedMedia, baseTmdbMatch, {
      ...universalOptions,
      namingPreset: 'kodi',
    });

    expect(plan.tasks[0].target).toMatch(/低智商犯罪$/);
    expect(plan.tasks[1].target).toContain('Season 1');
  });
});
