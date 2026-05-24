import type { Locale } from './i18n';

export interface DocMeta {
  slug: string;
  zh: string;
  en: string;
}

export const docList: DocMeta[] = [
  { slug: 'getting-started', zh: '快速开始', en: 'Getting Started' },
  { slug: 'installation', zh: '安装指南', en: 'Installation' },
  { slug: 'configuration', zh: '配置说明', en: 'Configuration' },
  { slug: 'faq', zh: '常见问题', en: 'FAQ' },
];

export interface DocContent {
  title: string;
  content: string;
}

// --- Getting Started ---
const gettingStartedZh = `# 快速开始

## Metarr 是什么？

Metarr 是一款智能媒体文件重命名工具，专为 Jellyfin/Emby/Plex 用户设计。它能自动解析复杂的影视文件名，匹配 TMDB 数据库信息，并一键重命名为标准的媒体库目录结构。

## 三种使用方式

### 1. 桌面应用（推荐）

桌面应用提供完整的图形界面，支持：
- 拖拽添加媒体目录
- 实时预览解析结果和重命名计划
- 批量处理多个目录
- 冲突检测和解决

### 2. 命令行工具（CLI）

适合自动化脚本和高级用户：

\`\`\`bash
npm install -g @metarr/cli
metarr /path/to/media
\`\`\`

### 3. 在线 Demo

无需安装，直接在浏览器中体验核心解析功能。访问 [在线 Demo](/demo)。

## 基本工作流

1. **添加媒体目录** — 选择包含影视文件的目录
2. **自动解析** — Metarr 自动识别标题、年份、分辨率等信息
3. **搜索匹配** — 从 TMDB 搜索结果中选择正确的条目
4. **预览重命名** — 查看重命名计划，确认无误
5. **执行重命名** — 一键完成重命名
`;

const gettingStartedEn = `# Getting Started

## What is Metarr?

Metarr is a smart media file renaming tool designed for Jellyfin/Emby/Plex users. It automatically parses complex media filenames, matches TMDB database info, and renames files to standard media library directory structures with one click.

## Three Ways to Use

### 1. Desktop App (Recommended)

The desktop app provides a full GUI with:
- Drag-and-drop media directories
- Real-time preview of parse results and rename plans
- Batch processing of multiple directories
- Conflict detection and resolution

### 2. Command-Line Tool (CLI)

For automation scripts and power users:

\`\`\`bash
npm install -g @metarr/cli
metarr /path/to/media
\`\`\`

### 3. Online Demo

No installation needed. Experience core parsing features directly in your browser. Visit the [Online Demo](/demo).

## Basic Workflow

1. **Add media directory** — Select a directory containing media files
2. **Auto parse** — Metarr automatically identifies title, year, resolution, etc.
3. **Search match** — Select the correct entry from TMDB search results
4. **Preview rename** — Review the rename plan
5. **Execute** — Complete the rename with one click
`;

// --- Installation ---
const installationZh = `# 安装指南

## 桌面应用

从 [GitHub Releases](https://github.com/hatlonely/metarr/releases) 下载对应平台的安装包：

- **Windows**: \`.exe\` 安装包
- **macOS**: \`.dmg\` 镜像文件
- **Linux**: \`.AppImage\` 或 \`.deb\` 包

### 系统要求

- Windows 10+ / macOS 12+ / Ubuntu 20.04+
- 至少 100MB 磁盘空间

## 命令行工具

\`\`\`bash
npm install -g @metarr/cli
\`\`\`

### 系统要求

- Node.js >= 20.0.0
- 支持 Windows / macOS / Linux
`;

const installationEn = `# Installation

## Desktop App

Download the installer for your platform from [GitHub Releases](https://github.com/hatlonely/metarr/releases):

- **Windows**: \`.exe\` installer
- **macOS**: \`.dmg\` disk image
- **Linux**: \`.AppImage\` or \`.deb\` package

### System Requirements

- Windows 10+ / macOS 12+ / Ubuntu 20.04+
- At least 100MB disk space

## CLI Tool

\`\`\`bash
npm install -g @metarr/cli
\`\`\`

### System Requirements

- Node.js >= 20.0.0
- Windows / macOS / Linux supported
`;

// --- Configuration ---
const configurationZh = `# 配置说明

## TMDB API Key

Metarr 使用 TheMovieDB (TMDB) API 进行影视信息匹配。你需要获取一个免费的 API Key：

1. 访问 [themoviedb.org](https://www.themoviedb.org/)
2. 注册账号并登录
3. 进入 Settings > API 页面
4. 申请 API Key（选择 Developer）
5. 复制 API Key (v3 auth)

## 配置文件

配置文件位于：

- **Windows**: \`%APPDATA%\\metarr\\config.json\`
- **macOS**: \`~/Library/Application Support/metarr/config.json\`
- **Linux**: \`~/.config/metarr/config.json\`

## 配置项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| \`tmdbKey\` | TMDB API Key | 无 |
| \`language\` | 界面语言 (zh/en) | zh |
| \`defaultType\` | 默认媒体类型 (tv/movie/auto) | auto |
`;

const configurationEn = `# Configuration

## TMDB API Key

Metarr uses TheMovieDB (TMDB) API for media info matching. You need a free API Key:

1. Visit [themoviedb.org](https://www.themoviedb.org/)
2. Register and log in
3. Go to Settings > API page
4. Request an API Key (select Developer)
5. Copy the API Key (v3 auth)

## Config File

The config file is located at:

- **Windows**: \`%APPDATA%\\metarr\\config.json\`
- **macOS**: \`~/Library/Application Support/metarr/config.json\`
- **Linux**: \`~/.config/metarr/config.json\`

## Options

| Option | Description | Default |
|--------|-------------|---------|
| \`tmdbKey\` | TMDB API Key | none |
| \`language\` | UI language (zh/en) | zh |
| \`defaultType\` | Default media type (tv/movie/auto) | auto |
`;

// --- FAQ ---
const faqZh = `# 常见问题

## Metarr 支持哪些格式？

Metarr 支持常见的视频格式：
- MKV、MP4、AVI、WMV、MOV、TS、RMVB、FLV、WebM

以及常见的字幕格式：
- SRT、ASS、SSA、SUB、IDX、SUP

## Jellyfin 命名规则是什么？

Metarr 按照以下规则组织文件：

**电视剧：**
\`\`\`
剧名 (年份)/
  Season 01/
    S01E01 - 集名.mkv
    S01E01 - 集名.zh.srt
    S01E02 - 集名.mkv
\`\`\`

**电影：**
\`\`\`
电影名 (年份)/
  电影名 (年份).mkv
  电影名 (年份).zh.srt
\`\`\`

## 支持中英文混合文件名吗？

支持。Metarr 能同时识别中文标题和英文标题，并分别提取。

## 重命名会删除原文件吗？

不会。Metarr 执行的是重命名操作（移动文件），不会删除任何文件。如果目标路径已存在同名文件，Metarr 会提示冲突。

## TMDB API Key 安全吗？

API Key 仅存储在本地配置文件中，不会上传到任何第三方服务器。
`;

const faqEn = `# FAQ

## What formats does Metarr support?

Metarr supports common video formats:
- MKV, MP4, AVI, WMV, MOV, TS, RMVB, FLV, WebM

And common subtitle formats:
- SRT, ASS, SSA, SUB, IDX, SUP

## What are the Jellyfin naming conventions?

Metarr organizes files following these rules:

**TV Shows:**
\`\`\`
Show Name (Year)/
  Season 01/
    S01E01 - Episode Name.mkv
    S01E01 - Episode Name.en.srt
    S01E02 - Episode Name.mkv
\`\`\`

**Movies:**
\`\`\`
Movie Name (Year)/
  Movie Name (Year).mkv
  Movie Name (Year).en.srt
\`\`\`

## Does it support bilingual Chinese/English filenames?

Yes. Metarr can recognize both Chinese and English titles simultaneously.

## Will renaming delete original files?

No. Metarr performs rename (move) operations only. It never deletes files. If a file with the same name exists at the destination, Metarr will alert you about the conflict.

## Is my TMDB API Key secure?

The API Key is stored only in your local config file and is never uploaded to any third-party servers.
`;

const docs: Record<string, Record<Locale, string>> = {
  'getting-started': { zh: gettingStartedZh, en: gettingStartedEn },
  installation: { zh: installationZh, en: installationEn },
  configuration: { zh: configurationZh, en: configurationEn },
  faq: { zh: faqZh, en: faqEn },
};

export function getDocContent(slug: string, locale: Locale): DocContent | null {
  const entry = docs[slug];
  if (!entry) return null;
  const meta = docList.find((d) => d.slug === slug);
  if (!meta) return null;
  return {
    title: locale === 'zh' ? meta.zh : meta.en,
    content: entry[locale],
  };
}
