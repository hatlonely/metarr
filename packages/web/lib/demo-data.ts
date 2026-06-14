import type { Locale } from './i18n';

export interface DemoPreset {
  dirName: string;
  files: string[];
}

export interface FakeSearchResult {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  overview: string;
  type: 'tv' | 'movie';
}

export interface FakeRenamePlan {
  originalDirName: string;
  newDirName: string;
  files: { original: string; renamed: string }[];
}

interface DemoDataSet {
  presets: Record<Locale, DemoPreset[]>;
  searchResults: Record<string, FakeSearchResult[]>;
  renamePlan: Record<string, FakeRenamePlan>;
}

export const demoData: DemoDataSet = {
  presets: {
    zh: [
      {
        dirName: '繁花.Blossoms.Shanghai.S01.2023.2160p.WEB-DL.H265.DDP5.1-Group',
        files: [
          '繁花.Blossoms.Shanghai.S01E01.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          '繁花.Blossoms.Shanghai.S01E02.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          '繁花.Blossoms.Shanghai.S01E03.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
        ],
      },
      {
        dirName: '沙丘3.Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON',
        files: [
          '沙丘3.Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON.mkv',
        ],
      },
      {
        dirName: '庆余年2.Joy.of.Life.S02.2024.1080p.WEB-DL.H264.AAC-QHstudIo',
        files: [
          '庆余年2.Joy.of.Life.S02E01.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
          '庆余年2.Joy.of.Life.S02E02.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
          '庆余年2.Joy.of.Life.S02E03.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
        ],
      },
    ],
    en: [
      {
        dirName: 'Shogun.S01.2024.2160p.WEB-DL.H265.DDP5.1-Group',
        files: [
          'Shogun.S01E01.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          'Shogun.S01E02.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          'Shogun.S01E03.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
        ],
      },
      {
        dirName: 'Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON',
        files: [
          'Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON.mkv',
        ],
      },
      {
        dirName: 'The.Last.of.Us.S02.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt',
        files: [
          'The.Last.of.Us.S02E01.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt.mkv',
          'The.Last.of.Us.S02E02.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt.mkv',
        ],
      },
    ],
  },
  searchResults: {
    '繁花': [
      {
        id: 27683,
        title: '繁花',
        originalTitle: '繁花',
        year: 2023,
        overview: '上世纪九十年代初，煌煌大时代，人人争上游，阿宝也变成了宝总，成功过，失败过，在沪上弄潮儿女中留下一段段传奇传说……',
        type: 'tv',
      },
    ],
    '沙丘': [
      {
        id: 438631,
        title: '沙丘：第三部',
        originalTitle: 'Dune: Part Three',
        year: 2026,
        overview: '保罗·厄崔迪与弗瑞曼人联合，踏上复仇之路，同时面对着宇宙各方势力的博弈。',
        type: 'movie',
      },
    ],
    '庆余年': [
      {
        id: 94997,
        title: '庆余年 第二季',
        originalTitle: 'Joy of Life Season 2',
        year: 2024,
        overview: '范闲用智谋揭穿二皇子的阴谋，出使北齐归来后，面临朝堂更大的风云变幻。',
        type: 'tv',
      },
    ],
    'Shogun': [
      {
        id: 209235,
        title: 'Shogun',
        originalTitle: 'Shōgun',
        year: 2024,
        overview: 'Set in 1600 Japan, Lord Yoshii Toranaga is fighting for his life as his enemies unite against him.',
        type: 'tv',
      },
    ],
    'Dune': [
      {
        id: 438631,
        title: 'Dune: Part Three',
        originalTitle: 'Dune: Part Three',
        year: 2026,
        overview: 'Paul Atreides unites with the Fremen to seek revenge against those who destroyed his family.',
        type: 'movie',
      },
    ],
    'The Last of Us': [
      {
        id: 100088,
        title: 'The Last of Us',
        originalTitle: 'The Last of Us',
        year: 2025,
        overview: 'Joel and Ellie continue their journey through a post-apocalyptic world, facing new threats.',
        type: 'tv',
      },
    ],
  },
  renamePlan: {
    '繁花': {
      originalDirName: '繁花.Blossoms.Shanghai.S01.2023.2160p.WEB-DL.H265.DDP5.1-Group',
      newDirName: '繁花 (2023)',
      files: [
        {
          original: '繁花.Blossoms.Shanghai.S01E01.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E01 - 繁花.mkv',
        },
        {
          original: '繁花.Blossoms.Shanghai.S01E02.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E02 - 繁花.mkv',
        },
        {
          original: '繁花.Blossoms.Shanghai.S01E03.2023.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E03 - 繁花.mkv',
        },
      ],
    },
    '沙丘': {
      originalDirName: '沙丘3.Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON',
      newDirName: '沙丘3 (2026)',
      files: [
        {
          original: '沙丘3.Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON.mkv',
          renamed: '沙丘3 (2026).mkv',
        },
      ],
    },
    '庆余年': {
      originalDirName: '庆余年2.Joy.of.Life.S02.2024.1080p.WEB-DL.H264.AAC-QHstudIo',
      newDirName: '庆余年 第二季 (2024)',
      files: [
        {
          original: '庆余年2.Joy.of.Life.S02E01.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
          renamed: 'Season 01/S01E01 - 庆余年.mkv',
        },
        {
          original: '庆余年2.Joy.of.Life.S02E02.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
          renamed: 'Season 01/S01E02 - 庆余年.mkv',
        },
        {
          original: '庆余年2.Joy.of.Life.S02E03.2024.1080p.WEB-DL.H264.AAC-QHstudIo.mkv',
          renamed: 'Season 01/S01E03 - 庆余年.mkv',
        },
      ],
    },
    'Shogun': {
      originalDirName: 'Shogun.S01.2024.2160p.WEB-DL.H265.DDP5.1-Group',
      newDirName: 'Shōgun (2024)',
      files: [
        {
          original: 'Shogun.S01E01.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E01 - Shōgun.mkv',
        },
        {
          original: 'Shogun.S01E02.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E02 - Shōgun.mkv',
        },
        {
          original: 'Shogun.S01E03.2024.2160p.WEB-DL.H265.DDP5.1-Group.mkv',
          renamed: 'Season 01/S01E03 - Shōgun.mkv',
        },
      ],
    },
    'Dune': {
      originalDirName: 'Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON',
      newDirName: 'Dune: Part Three (2026)',
      files: [
        {
          original: 'Dune.Part.Three.2026.2160p.BluRay.REMUX.HEVC.DTS-HD.MA.7.1-EPSiLON.mkv',
          renamed: 'Dune Part Three (2026).mkv',
        },
      ],
    },
    'The Last of Us': {
      originalDirName: 'The.Last.of.Us.S02.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt',
      newDirName: 'The Last of Us (2025)',
      files: [
        {
          original: 'The.Last.of.Us.S02E01.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt.mkv',
          renamed: 'Season 01/S01E01 - The Last of Us.mkv',
        },
        {
          original: 'The.Last.of.Us.S02E02.2025.2160p.WEB-DL.H265.DV.DDP5.1-HiDt.mkv',
          renamed: 'Season 01/S01E02 - The Last of Us.mkv',
        },
      ],
    },
  },
};

// --- Derived demo data for subtitle & artwork steps ---

export interface DemoSubtitleGroup {
  /** Leaf name of the video file, e.g. "S01E01 - 繁花.mkv" */
  videoFile: string;
  items: { language: string; source: 'SubDL' | 'Assrt'; file: string }[];
}

export interface DemoArtworkResult {
  images: { type: string; file: string }[];
  nfos: { type: string; file: string }[];
}

const SUBTITLE_LANGS = [
  { display: '简体中文', suffix: 'zh', source: 'SubDL' as const },
  { display: 'English', suffix: 'en', source: 'Assrt' as const },
];

/** Build the subtitle download preview from a rename plan (one entry per video file). */
export function deriveSubtitles(plan: FakeRenamePlan): DemoSubtitleGroup[] {
  return plan.files.map((file) => {
    const noExt = file.renamed.replace(/\.[^./]+$/, '');
    const leaf = file.renamed.split('/').pop() ?? file.renamed;
    return {
      videoFile: leaf,
      items: SUBTITLE_LANGS.map((l) => ({
        language: l.display,
        source: l.source,
        file: `${noExt}.${l.suffix}.srt`.split('/').pop() ?? '',
      })),
    };
  });
}

/** Build the artwork/NFO preview from a rename plan and media type. */
export function deriveArtwork(plan: FakeRenamePlan, type: 'tv' | 'movie'): DemoArtworkResult {
  if (type === 'movie') {
    return {
      images: [
        { type: 'poster', file: 'poster.jpg' },
        { type: 'fanart', file: 'fanart.jpg' },
      ],
      nfos: [{ type: 'movie', file: 'movie.nfo' }],
    };
  }
  const hasSeason = plan.files.some((f) => f.renamed.includes('/'));
  return {
    images: [
      { type: 'poster', file: 'poster.jpg' },
      { type: 'fanart', file: 'fanart.jpg' },
      ...(hasSeason ? [{ type: 'season-poster', file: 'Season 01/poster.jpg' }] : []),
      ...(hasSeason ? [{ type: 'episode-thumb', file: 'Season 01/S01E01-thumb.jpg' }] : []),
    ],
    nfos: [
      { type: 'tvshow', file: 'tvshow.nfo' },
      ...(hasSeason ? [{ type: 'episode', file: 'Season 01/S01E01.nfo' }] : []),
    ],
  };
}

export function findDemoDataKey(chineseTitle?: string, englishTitle?: string): string {
  if (chineseTitle) {
    for (const key of Object.keys(demoData.searchResults)) {
      if (chineseTitle.includes(key) || key.includes(chineseTitle.slice(0, 2))) {
        return key;
      }
    }
  }
  if (englishTitle) {
    const words = englishTitle.split(' ');
    for (const key of Object.keys(demoData.searchResults)) {
      const keyLower = key.toLowerCase();
      if (words.some((w) => keyLower.includes(w.toLowerCase()))) {
        return key;
      }
    }
  }
  return '';
}

export function getSearchResults(key: string): FakeSearchResult[] {
  return demoData.searchResults[key] || [];
}

export function getRenamePlan(key: string): FakeRenamePlan | null {
  return demoData.renamePlan[key] || null;
}
