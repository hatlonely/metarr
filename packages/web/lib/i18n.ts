export type Locale = 'zh' | 'en';

const zh = {
  nav: {
    features: '功能',
    demo: '在线体验',
    docs: '文档',
    download: '下载',
    changelog: '更新日志',
  },
  landing: {
    heroTitle: '智能媒体文件重命名',
    heroSubtitle:
      '自动解析影视文件名，匹配 TMDB 信息，一键重命名为 Jellyfin 兼容格式。支持桌面应用、命令行和在线体验。',
    tryDemo: '在线体验',
    download: '立即下载',
    feature1Title: '智能解析',
    feature1Desc: '自动识别中文/英文标题、年份、分辨率、编码格式、音轨等媒体标签信息。',
    feature2Title: 'TMDB 匹配',
    feature2Desc: '通过 TMDB 数据库精确匹配影视信息，获取准确的中文标题和剧集数据。',
    feature3Title: '一键重命名',
    feature3Desc: '生成符合 Jellyfin/Emby/Plex 规范的目录结构和文件名，整理媒体库。',
    demoTeaserTitle: '亲自试试',
    demoTeaserDesc: '无需安装，直接在浏览器中体验完整的解析和重命名流程。',
    demoTeaserBtn: '开始体验',
    downloadCtaTitle: '开始使用 Metarr',
    downloadCtaDesc: '桌面应用功能最完整，支持批量处理和自动重命名。',
  },
  demo: {
    title: '在线 Demo',
    step1Title: '输入文件名',
    step1Desc: '输入一个影视目录名或文件名，或选择一个预设示例。',
    step2Title: '解析结果',
    step2Desc: 'Metarr 会自动提取标题、年份和媒体标签信息。',
    step3Title: '搜索匹配',
    step3Desc: '从 TMDB 搜索结果中选择正确的影视条目。',
    step4Title: '重命名预览',
    step4Desc: '预览重命名后的目录结构和文件名。',
    parse: '解析',
    searchTmdb: '搜索 TMDB',
    selectMatch: '选择此结果',
    restart: '重新开始',
    next: '下一步',
    preset: '预设示例',
    presetPlaceholder: '选择一个示例...',
    inputPlaceholder: '输入影视目录名或文件名...',
    result: '解析结果',
    noResult: '无法解析，请检查输入内容',
    dirName: '目录名',
    titleLabel: '标题',
    year: '年份',
    tags: '标签',
    episodes: '文件列表',
    season: '季',
    episode: '集',
    original: '原始文件名',
    renamed: '重命名后',
    newStructure: '新目录结构',
  },
  docs: {
    title: '文档',
    subtitle: '快速了解如何使用 Metarr',
    gettingStarted: '快速开始',
    installation: '安装指南',
    configuration: '配置说明',
    faq: '常见问题',
  },
  download: {
    title: '下载',
    subtitle: '选择适合你的使用方式',
    desktop: '桌面应用',
    desktopDesc: '功能最完整的版本，支持图形界面批量处理。',
    windows: 'Windows',
    macOS: 'macOS',
    linux: 'Linux',
    downloadFromGithub: '从 GitHub 下载',
    cli: '命令行工具',
    cliDesc: '轻量级命令行工具，适合自动化脚本和高级用户。',
    cliInstall: '安装命令',
    copy: '复制',
    copied: '已复制',
    requirements: '系统要求',
    requirementsList: 'Node.js >= 20.0.0',
    webDemo: '在线体验',
    webDemoDesc: '无需安装，直接在浏览器中体验核心功能。',
    webDemoBtn: '打开在线 Demo',
  },
  changelog: {
    title: '更新日志',
    subtitle: 'Metarr 的版本更新记录',
  },
  footer: {
    description: '智能媒体文件重命名工具，为 Jellyfin 用户打造。',
    copyright: 'Metarr',
    links: '链接',
  },
  features: {
    title: '功能详情',
    subtitle: '了解 Metarr 的核心能力',
    smartParse: {
      title: '智能名称解析',
      desc: 'Metarr 使用正则表达式和规则引擎，从复杂的影视文件名中提取结构化信息：',
      item1: '中英文双语标题识别',
      item2: '年份自动提取',
      item3: '分辨率检测（480p / 720p / 1080p / 2160p）',
      item4: '编码格式识别（H.264 / H.265 / AV1 / VP9）',
      item5: '音轨信息（DDP5.1 / DTS-HD MA / TrueHD / FLAC）',
      item6: 'HDR / 杜比视界检测',
      item7: '来源识别（WEB-DL / BluRay / REMUX / HDTV）',
    },
    tmdbMatch: {
      title: 'TMDB 信息匹配',
      desc: '集成 TheMovieDB 数据库，为你的媒体库提供准确的元数据：',
      item1: '支持电视剧和电影搜索',
      item2: '中英文标题精确匹配',
      item3: '自动获取剧集信息',
      item4: '返回标准化媒体信息',
    },
    autoRename: {
      title: '自动重命名',
      desc: '一键将媒体文件整理为标准的 Jellyfin 目录结构：',
      item1: '电视剧：剧名 (年份)/Season 季/S季E集 - 集名.扩展名',
      item2: '电影：电影名 (年份)/电影名 (年份).扩展名',
      item3: '关联字幕文件自动跟随',
      item4: '冲突检测和预览',
      item5: '支持批量处理',
    },
  },
  theme: {
    light: '浅色',
    dark: '深色',
    system: '跟随系统',
  },
} as const;

const en = {
  nav: {
    features: 'Features',
    demo: 'Demo',
    docs: 'Docs',
    download: 'Download',
    changelog: 'Changelog',
  },
  landing: {
    heroTitle: 'Smart Media File Renamer',
    heroSubtitle:
      'Automatically parse media filenames, match TMDB info, and rename to Jellyfin-compatible format. Desktop app, CLI, and online demo available.',
    tryDemo: 'Try Online',
    download: 'Download',
    feature1Title: 'Smart Parsing',
    feature1Desc:
      'Automatically recognize Chinese/English titles, year, resolution, codec, audio tracks and other media tags.',
    feature2Title: 'TMDB Matching',
    feature2Desc:
      'Accurately match media info via TMDB database, getting correct titles and episode data.',
    feature3Title: 'One-Click Rename',
    feature3Desc:
      'Generate Jellyfin/Emby/Plex compliant directory structures and filenames for your media library.',
    demoTeaserTitle: 'Try It Yourself',
    demoTeaserDesc: 'Experience the full parsing and renaming workflow right in your browser.',
    demoTeaserBtn: 'Start Demo',
    downloadCtaTitle: 'Get Started with Metarr',
    downloadCtaDesc: 'The desktop app offers the most complete features, with batch processing and auto-rename.',
  },
  demo: {
    title: 'Online Demo',
    step1Title: 'Input Filename',
    step1Desc: 'Enter a media directory or file name, or select a preset example.',
    step2Title: 'Parse Result',
    step2Desc: 'Metarr automatically extracts title, year and media tag information.',
    step3Title: 'Search Match',
    step3Desc: 'Select the correct media entry from TMDB search results.',
    step4Title: 'Rename Preview',
    step4Desc: 'Preview the renamed directory structure and filenames.',
    parse: 'Parse',
    searchTmdb: 'Search TMDB',
    selectMatch: 'Select this match',
    restart: 'Restart',
    next: 'Next',
    preset: 'Preset',
    presetPlaceholder: 'Select an example...',
    inputPlaceholder: 'Enter media directory or file name...',
    result: 'Parse Result',
    noResult: 'Unable to parse, please check your input',
    dirName: 'Directory Name',
    titleLabel: 'Title',
    year: 'Year',
    tags: 'Tags',
    episodes: 'File List',
    season: 'Season',
    episode: 'Episode',
    original: 'Original',
    renamed: 'Renamed',
    newStructure: 'New Structure',
  },
  docs: {
    title: 'Documentation',
    subtitle: 'Learn how to use Metarr quickly',
    gettingStarted: 'Getting Started',
    installation: 'Installation',
    configuration: 'Configuration',
    faq: 'FAQ',
  },
  download: {
    title: 'Download',
    subtitle: 'Choose the best way to use Metarr',
    desktop: 'Desktop App',
    desktopDesc: 'The most full-featured version with GUI for batch processing.',
    windows: 'Windows',
    macOS: 'macOS',
    linux: 'Linux',
    downloadFromGithub: 'Download from GitHub',
    cli: 'CLI Tool',
    cliDesc: 'Lightweight command-line tool for automation scripts and power users.',
    cliInstall: 'Install Command',
    copy: 'Copy',
    copied: 'Copied',
    requirements: 'Requirements',
    requirementsList: 'Node.js >= 20.0.0',
    webDemo: 'Online Demo',
    webDemoDesc: 'No installation needed. Experience core features directly in your browser.',
    webDemoBtn: 'Open Online Demo',
  },
  changelog: {
    title: 'Changelog',
    subtitle: 'Metarr version history',
  },
  footer: {
    description: 'Smart media file renamer, built for Jellyfin users.',
    copyright: 'Metarr',
    links: 'Links',
  },
  features: {
    title: 'Features',
    subtitle: 'Explore Metarr\'s core capabilities',
    smartParse: {
      title: 'Smart Name Parsing',
      desc: 'Metarr uses regex and rule engines to extract structured information from complex media filenames:',
      item1: 'Bilingual Chinese/English title recognition',
      item2: 'Automatic year extraction',
      item3: 'Resolution detection (480p / 720p / 1080p / 2160p)',
      item4: 'Codec identification (H.264 / H.265 / AV1 / VP9)',
      item5: 'Audio track info (DDP5.1 / DTS-HD MA / TrueHD / FLAC)',
      item6: 'HDR / Dolby Vision detection',
      item7: 'Source identification (WEB-DL / BluRay / REMUX / HDTV)',
    },
    tmdbMatch: {
      title: 'TMDB Info Matching',
      desc: 'Integrated with TheMovieDB for accurate media metadata:',
      item1: 'TV shows and movies search',
      item2: 'Precise Chinese/English title matching',
      item3: 'Automatic episode info retrieval',
      item4: 'Normalized media information output',
    },
    autoRename: {
      title: 'Auto Rename',
      desc: 'One-click media file organization into standard Jellyfin directory structure:',
      item1: 'TV: Show Name (Year)/Season X/SXXEXX - Episode.ext',
      item2: 'Movie: Movie Name (Year)/Movie Name (Year).ext',
      item3: 'Associated subtitle files follow automatically',
      item4: 'Conflict detection and preview',
      item5: 'Batch processing support',
    },
  },
  theme: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
} as const;

type Translations = {
  nav: { features: string; demo: string; docs: string; download: string; changelog: string };
  landing: {
    heroTitle: string; heroSubtitle: string; tryDemo: string; download: string;
    feature1Title: string; feature1Desc: string;
    feature2Title: string; feature2Desc: string;
    feature3Title: string; feature3Desc: string;
    demoTeaserTitle: string; demoTeaserDesc: string; demoTeaserBtn: string;
    downloadCtaTitle: string; downloadCtaDesc: string;
  };
  demo: {
    title: string;
    step1Title: string; step1Desc: string;
    step2Title: string; step2Desc: string;
    step3Title: string; step3Desc: string;
    step4Title: string; step4Desc: string;
    parse: string; searchTmdb: string; selectMatch: string; restart: string; next: string;
    preset: string; presetPlaceholder: string; inputPlaceholder: string;
    result: string; noResult: string;
    dirName: string; titleLabel: string; year: string; tags: string; episodes: string;
    season: string; episode: string;
    original: string; renamed: string; newStructure: string;
  };
  docs: { title: string; subtitle: string; gettingStarted: string; installation: string; configuration: string; faq: string };
  download: {
    title: string; subtitle: string;
    desktop: string; desktopDesc: string; windows: string; macOS: string; linux: string; downloadFromGithub: string;
    cli: string; cliDesc: string; cliInstall: string; copy: string; copied: string;
    requirements: string; requirementsList: string;
    webDemo: string; webDemoDesc: string; webDemoBtn: string;
  };
  changelog: { title: string; subtitle: string };
  footer: { description: string; copyright: string; links: string };
  features: {
    title: string; subtitle: string;
    smartParse: { title: string; desc: string; item1: string; item2: string; item3: string; item4: string; item5: string; item6: string; item7: string };
    tmdbMatch: { title: string; desc: string; item1: string; item2: string; item3: string; item4: string };
    autoRename: { title: string; desc: string; item1: string; item2: string; item3: string; item4: string; item5: string };
  };
  theme: { light: string; dark: string; system: string };
};

const translations: Record<Locale, Translations> = { zh, en };

export function t(locale: Locale): Translations {
  return translations[locale];
}
