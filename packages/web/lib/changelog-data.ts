export interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: 'feature' | 'fix' | 'change'; zh: string; en: string }[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2025-01-01',
    changes: [
      { type: 'feature', zh: '初始发布：智能媒体文件名解析', en: 'Initial release: smart media filename parsing' },
      { type: 'feature', zh: '支持中文/英文双语标题识别', en: 'Bilingual Chinese/English title recognition' },
      { type: 'feature', zh: 'TMDB 搜索和匹配', en: 'TMDB search and matching' },
      { type: 'feature', zh: '一键重命名为 Jellyfin 兼容格式', en: 'One-click rename to Jellyfin-compatible format' },
      { type: 'feature', zh: '桌面应用（GUI）', en: 'Desktop application (GUI)' },
      { type: 'feature', zh: '命令行工具（CLI）', en: 'Command-line tool (CLI)' },
      { type: 'feature', zh: '在线 Demo', en: 'Online demo' },
    ],
  },
];
