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
  { slug: 'subtitle-setup', zh: '字幕下载配置', en: 'Subtitle Setup' },
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

Metarr 使用 [TheMovieDB (TMDB)](https://www.themoviedb.org/) API 获取影视元数据。

**获取步骤：**

1. 访问 [themoviedb.org](https://www.themoviedb.org/) 并注册账号
2. 登录后进入 **Settings → API**
3. 点击 **申请 API Key**，类型选择 **Developer（开发者）**
4. 填写应用信息（名称随意，用途填个人使用即可）
5. 复制生成的 **API Key (v3 auth)**

> TMDB API 完全免费，个人使用无请求限制。

---

## 命名方案

Metarr 支持多种媒体服务器的命名规范，在设置中选择对应方案：

| 方案 | 适用服务 | 目录示例 |
|------|---------|---------|
| **通用（推荐）** | Jellyfin / Plex / Emby / Infuse | \`剧名 (2024)/Season 01/剧名 S01E01.mkv\` |
| **Jellyfin** | Jellyfin / Emby | \`剧名 (2024) [tmdbid-1234]/Season 01/剧名 (2024) S01E01.mkv\` |
| **Plex** | Plex | \`剧名 (2024)/Season 01/剧名 - S01E01.mkv\` |
| **Kodi** | Kodi | \`剧名/Season 1/剧名 S01E01.mkv\` |
| **自定义** | 任意 | 自定义所有字段模板 |

### 自定义模板变量

| 变量 | 说明 | 示例 |
|------|------|------|
| \`{name}\` | 显示名称（当前语言） | \`权力的游戏\` |
| \`{year}\` | 年份 | \`2011\` |
| \`{tmdbId}\` | TMDB ID | \`1399\` |
| \`{idTag}\` | ID 标签（自动选优） | \`[tmdbid-1399]\` |
| \`{season:02}\` | 季数（零填充） | \`01\` |
| \`{episode:02}\` | 集数（零填充） | \`03\` |
| \`{ext}\` | 文件扩展名 | \`.mkv\` |

---

## 封面与元数据

Metarr 可自动从 TMDB 下载封面并生成 NFO 元数据文件（需先完成媒体匹配）：

- **海报** (poster.jpg)：媒体主海报图
- **背景图** (fanart.jpg)：宽幅背景图
- **Season 海报**：各季专属海报
- **集缩略图**：每集预览图（-thumb.jpg）
- **NFO 文件**：Kodi/Jellyfin/Emby 离线元数据，包含类型、评分、简介等

以上均为可选，在预览步骤中可逐个勾选。

---

## 字幕下载

Metarr 支持从 SubDL 和射手网自动下载字幕，详见 [字幕下载配置](/docs/subtitle-setup)。

---

## 配置文件位置

配置自动保存至 \`~/.metarr/config.json\`：

- **macOS / Linux**: \`~/.metarr/config.json\`
- **Windows**: \`C:\\Users\\用户名\\.metarr\\config.json\`

## 完整配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| \`tmdbKey\` | TMDB API Key | 无 |
| \`destPath\` | 默认输出目录 | 无 |
| \`displayLanguage\` | 显示语言（zh-CN / en-US） | zh-CN |
| \`preferImdbId\` | 电影优先使用 IMDB ID | true |
| \`namingPreset\` | 命名方案 | universal |
| \`subdlApiKey\` | SubDL API Key | 无 |
| \`assrtToken\` | 射手网 Token | 无 |
| \`subtitleLanguages\` | 字幕语言列表 | ["zh","en"] |
`;

const configurationEn = `# Configuration

## TMDB API Key

Metarr uses the [TheMovieDB (TMDB)](https://www.themoviedb.org/) API to fetch media metadata.

**How to get it:**

1. Visit [themoviedb.org](https://www.themoviedb.org/) and create an account
2. After logging in, go to **Settings → API**
3. Click **Request an API Key**, select **Developer**
4. Fill in the app details (any name; "personal use" for purpose)
5. Copy the **API Key (v3 auth)**

> The TMDB API is completely free with no rate limits for personal use.

---

## Naming Presets

Metarr supports naming conventions for multiple media servers:

| Preset | Works With | Directory Example |
|--------|-----------|------------------|
| **Universal (Recommended)** | Jellyfin / Plex / Emby / Infuse | \`Show (2024)/Season 01/Show S01E01.mkv\` |
| **Jellyfin** | Jellyfin / Emby | \`Show (2024) [tmdbid-1234]/Season 01/Show (2024) S01E01.mkv\` |
| **Plex** | Plex | \`Show (2024)/Season 01/Show - S01E01.mkv\` |
| **Kodi** | Kodi | \`Show/Season 1/Show S01E01.mkv\` |
| **Custom** | Any | Fully customizable templates |

### Custom Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| \`{name}\` | Display name (current language) | \`Game of Thrones\` |
| \`{year}\` | Year | \`2011\` |
| \`{tmdbId}\` | TMDB ID | \`1399\` |
| \`{idTag}\` | ID tag (auto-selected) | \`[tmdbid-1399]\` |
| \`{season:02}\` | Season number (zero-padded) | \`01\` |
| \`{episode:02}\` | Episode number (zero-padded) | \`03\` |
| \`{ext}\` | File extension | \`.mkv\` |

---

## Artwork & Metadata

Metarr can automatically download artwork and generate NFO metadata files from TMDB:

- **Poster** (poster.jpg): Main media poster
- **Fanart** (fanart.jpg): Wide backdrop image
- **Season Posters**: Per-season poster images
- **Episode Thumbnails**: Per-episode preview images (-thumb.jpg)
- **NFO Files**: Offline metadata for Kodi/Jellyfin/Emby (genres, ratings, plot, etc.)

All items are optional and can be toggled in the preview step.

---

## Subtitle Download

Metarr supports automatic subtitle downloads from SubDL and Assrt. See [Subtitle Setup](/docs/subtitle-setup) for details.

---

## Config File Location

Settings are saved to \`~/.metarr/config.json\`:

- **macOS / Linux**: \`~/.metarr/config.json\`
- **Windows**: \`C:\\Users\\username\\.metarr\\config.json\`

## All Config Options

| Option | Description | Default |
|--------|-------------|---------|
| \`tmdbKey\` | TMDB API Key | none |
| \`destPath\` | Default output directory | none |
| \`displayLanguage\` | UI language (zh-CN / en-US) | zh-CN |
| \`preferImdbId\` | Prefer IMDB ID for movies | true |
| \`namingPreset\` | Naming preset | universal |
| \`subdlApiKey\` | SubDL API Key | none |
| \`assrtToken\` | Assrt Token | none |
| \`subtitleLanguages\` | Subtitle language list | ["zh","en"] |
`;

// --- Subtitle Setup ---
const subtitleSetupZh = `# 字幕下载配置

Metarr 支持从 **SubDL** 和 **射手网（Assrt）** 两个来源自动下载字幕。两者均免费，建议同时配置以获得最佳覆盖率。

---

## SubDL（主要来源）

SubDL 是一个拥有大量多语言字幕的平台，支持通过 TMDB ID 精准搜索，中英文字幕覆盖良好。

### 获取 API Key

1. 访问 [subdl.com](https://subdl.com) 并注册账号
2. 登录后，访问 [subdl.com/panel/api](https://subdl.com/panel/api)
3. 页面上会显示你的 **API Key**，复制备用

### 使用说明

- 搜索时直接使用 TMDB ID，匹配精度高
- 非 zip 直链字幕可直接下载（zip 暂不支持）
- 免费账户无每日下载限制

---

## 射手网 Assrt（中文补充来源）

射手网是国内最主要的中文字幕资源站，中文字幕数量和质量均居首位。

### 获取 Token

1. 访问 [assrt.net](https://assrt.net) 并注册账号
2. 登录后，访问 [secure.assrt.net/usercp.php](https://secure.assrt.net/usercp.php)
3. 在页面中找到 **API 访问密钥（Token）**，复制备用

> 如果找不到 Token 字段，尝试在用户控制台页面向下滚动，或在 API 相关设置中查找。

### 使用说明

- 以关键词搜索（如"权力的游戏 S01E01"），对中文内容效果最佳
- 完全免费，无请求配额限制
- 搜索结果主要为中文字幕

---

## 字幕语言配置

在设置中勾选所需语言：

| 语言 | 代码 | 说明 |
|------|------|------|
| 简体中文 | zh | 大陆简体中文字幕 |
| 繁體中文 | zh-TW | 台湾繁体中文字幕 |
| English | en | 英文字幕 |
| 日本語 | ja | 日文字幕 |
| 한국어 | ko | 韩文字幕 |

默认开启：简体中文 + English。

---

## 字幕文件命名

下载的字幕文件会按照标准规范命名，与视频文件放在同一目录：

\`\`\`
Season 01/
  剧名 S01E01.mkv
  剧名 S01E01.zh.srt       ← 简体中文字幕
  剧名 S01E01.zh-TW.srt    ← 繁体中文字幕
  剧名 S01E01.en.srt        ← 英文字幕
\`\`\`

Jellyfin、Plex、Emby、Kodi 均可自动识别此命名格式。

---

## 常见问题

**Q：SubDL 和 Assrt 都没配置，字幕功能还能用吗？**

不能。至少需要配置其中一个才会显示字幕下载选项。

**Q：两个来源都配置了，会重复下载吗？**

不会。Metarr 按 targetPath 去重，同一文件路径只保留一个候选。

**Q：找不到想要的字幕版本怎么办？**

字幕候选按下载次数排序，取前几名展示。如果自动匹配结果不理想，可手动到 SubDL 或射手网搜索下载后放到对应目录。
`;

const subtitleSetupEn = `# Subtitle Setup

Metarr supports automatic subtitle downloads from **SubDL** and **Assrt**. Both are free — we recommend configuring both for the best coverage.

---

## SubDL (Primary Source)

SubDL is a subtitle platform with extensive multi-language coverage. It supports searching by TMDB ID for accurate matching.

### Get an API Key

1. Visit [subdl.com](https://subdl.com) and register an account
2. After logging in, go to [subdl.com/panel/api](https://subdl.com/panel/api)
3. Your **API Key** is displayed on that page — copy it

### Notes

- Searches use TMDB ID directly for high accuracy
- Only direct (non-zip) subtitle files are downloaded
- Free accounts have no daily download limit

---

## Assrt (Chinese Supplement Source)

Assrt is the leading Chinese subtitle site, with the best coverage and quality for Chinese-language content.

### Get a Token

1. Visit [assrt.net](https://assrt.net) and register an account
2. After logging in, visit [secure.assrt.net/usercp.php](https://secure.assrt.net/usercp.php)
3. Find the **API Access Token** field on that page and copy it

> If you can't find the Token field, try scrolling down on the user control panel page or look under API-related settings.

### Notes

- Searches use keyword queries (e.g. "Game of Thrones S01E01")
- Completely free with no quota limits
- Results are primarily Chinese subtitles

---

## Language Configuration

Select your preferred languages in Settings:

| Language | Code | Description |
|----------|------|-------------|
| Simplified Chinese | zh | Mainland simplified subtitles |
| Traditional Chinese | zh-TW | Taiwan traditional subtitles |
| English | en | English subtitles |
| Japanese | ja | Japanese subtitles |
| Korean | ko | Korean subtitles |

Default: Simplified Chinese + English.

---

## Subtitle File Naming

Downloaded subtitle files follow standard naming conventions and are placed alongside the video:

\`\`\`
Season 01/
  Show S01E01.mkv
  Show S01E01.zh.srt       ← Simplified Chinese
  Show S01E01.zh-TW.srt    ← Traditional Chinese
  Show S01E01.en.srt        ← English
\`\`\`

Jellyfin, Plex, Emby, and Kodi all recognize this naming format automatically.

---

## FAQ

**Q: Can I use subtitle download if neither SubDL nor Assrt is configured?**

No. At least one source must be configured for the subtitle section to appear.

**Q: Will both sources download the same subtitle file?**

No. Metarr deduplicates by target path — only one candidate per file location is kept.

**Q: What if the auto-matched subtitle doesn't sync with my video?**

Subtitle candidates are sorted by download count. If the automatic match isn't ideal, you can manually download a matching subtitle from SubDL or Assrt and place it in the correct directory.
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

不会。Metarr 执行的是重命名操作（移动文件），永不主动删除或覆盖任何文件。遇到冲突的旧文件或未匹配文件时，会将其移入回收站（默认同卷智能回收目录，绝不跨卷复制），而不是删除。每次重命名都会记录在历史中，可随时一键撤销、把文件还原回原位。

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

No. Metarr performs rename (move) operations only and never deletes or overwrites a file. Conflicting old files and unmatched files are moved to the trash (a smart same-volume trash by default, never copied across volumes) instead of being deleted. Every run is recorded in history and can be undone in one click, restoring files to their original location.

## Is my TMDB API Key secure?

The API Key is stored only in your local config file and is never uploaded to any third-party servers.
`;

const docs: Record<string, Record<Locale, string>> = {
  'getting-started': { zh: gettingStartedZh, en: gettingStartedEn },
  installation: { zh: installationZh, en: installationEn },
  configuration: { zh: configurationZh, en: configurationEn },
  'subtitle-setup': { zh: subtitleSetupZh, en: subtitleSetupEn },
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
