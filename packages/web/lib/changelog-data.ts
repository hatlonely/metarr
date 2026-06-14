export interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: 'feature' | 'fix' | 'change'; zh: string; en: string }[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '0.7.0',
    date: '2026-06-14',
    changes: [
      { type: 'fix', zh: '修复 Assrt 字幕下载（支持 zip / rar 压缩包解包）', en: 'Fix Assrt subtitle download (zip / rar archive extraction)' },
      { type: 'fix', zh: '修复 SubDL 字幕集成，对接真实 API', en: 'Fix SubDL subtitle integration against the real API' },
      { type: 'fix', zh: '修复字幕下载因闭包过期而从未执行的问题', en: 'Fix subtitle downloads never running due to a stale closure' },
      { type: 'feature', zh: '重命名预览的目录树中显示字幕文件', en: 'Show subtitle files in the rename preview directory tree' },
      { type: 'feature', zh: '执行确认对话框中显示字幕数量', en: 'Show subtitle count in the confirm-execute dialog' },
      { type: 'feature', zh: '输出目录或命名方案变更时自动重算计划', en: 'Auto-regenerate the plan when output path or naming preset changes' },
      { type: 'feature', zh: '密钥字段支持显示 / 隐藏切换', en: 'Add show / hide toggle for secret fields' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-06-01',
    changes: [
      { type: 'feature', zh: '新增字幕自动下载：SubDL + Assrt 双源', en: 'Add subtitle auto-download via SubDL + Assrt dual sources' },
      { type: 'fix', zh: '修复官网主题切换的 SSR 水合不一致', en: 'Fix theme toggle SSR hydration mismatch on the website' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-06-01',
    changes: [
      { type: 'feature', zh: '支持多媒体服务器命名预设（Jellyfin / Emby / Plex / Kodi / 通用）', en: 'Configurable naming presets for multiple media servers (Jellyfin / Emby / Plex / Kodi / universal)' },
      { type: 'feature', zh: '支持自定义命名模板与单次操作预设覆盖', en: 'Custom naming templates and per-operation preset override' },
      { type: 'feature', zh: '支持从 TMDB 下载海报 / 背景图', en: 'Download posters / fanart from TMDB' },
      { type: 'feature', zh: '生成 NFO 元数据文件与分集缩略图', en: 'Generate NFO metadata files and episode thumbnails' },
      { type: 'feature', zh: '新目录结构预览中显示刮削产物', en: 'Show artwork files in the new directory structure preview' },
    ],
  },
  {
    version: '0.4.1',
    date: '2026-05-25',
    changes: [
      { type: 'fix', zh: '当源路径与目标路径相同时跳过重命名', en: 'Skip rename when source and target paths are identical' },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-05-25',
    changes: [
      { type: 'feature', zh: '新增应用图标与网站 favicon', en: 'Add app icon and website favicon' },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-05-24',
    changes: [
      { type: 'fix', zh: '修复 Electron 下的资源相对路径加载', en: 'Fix relative asset paths under Electron' },
      { type: 'fix', zh: '完善 CI 构建与官网部署流程', en: 'Improve CI build and website deployment pipeline' },
    ],
  },
  {
    version: '0.2.0',
    date: '2026-05-24',
    changes: [
      { type: 'feature', zh: '新增 macOS 与 Windows 桌面安装包构建发布', en: 'Build and release macOS and Windows desktop installers' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-24',
    changes: [
      { type: 'feature', zh: '初始发布：智能媒体文件名解析（中英双语）', en: 'Initial release: smart bilingual media filename parsing' },
      { type: 'feature', zh: 'TMDB 搜索与匹配', en: 'TMDB search and matching' },
      { type: 'feature', zh: '一键重命名为媒体服务器兼容结构', en: 'One-click rename to media-server-compatible structure' },
      { type: 'feature', zh: '冲突检测与未匹配文件清理', en: 'Conflict detection and unmatched file cleanup' },
      { type: 'feature', zh: '桌面应用（GUI）、命令行（CLI）与在线体验', en: 'Desktop app (GUI), CLI, and online demo' },
    ],
  },
];
