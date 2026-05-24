# Metarr

媒体文件重命名工具，支持 Jellyfin 兼容的命名规范。提供 GUI（Electron）和 CLI 两种使用方式。

## 功能特性

- 解析影视文件名，提取标题、季/集号、分辨率、编码等信息
- 通过 TMDB API 搜索并匹配正确的影视信息
- 自动生成符合 Jellyfin/Plex 规范的重命名计划
- 支持电视剧和电影两种媒体类型
- 冲突检测与处理（跳过/覆盖）
- 未匹配文件检测与清理
- 中英文双语界面

## 项目结构

```
metarr/
├── packages/
│   ├── core/     # 核心库：解析器、TMDB 客户端、重命名逻辑、配置管理
│   ├── gui/      # Electron 桌面应用（Next.js + React + Tailwind）
│   └── cli/      # 命令行工具（Commander + Inquirer）
├── package.json  # Monorepo 根配置（npm workspaces）
├── tsconfig.json # 共享 TypeScript 配置
└── .prettierrc   # 代码格式化配置
```

### 包依赖关系

```
cli  ──┐
       ├──▶  core
gui  ──┘
```

`core` 是独立的核心业务库，`gui` 和 `cli` 都依赖它，彼此之间没有依赖。

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm（随 Node.js 安装）

### 安装依赖

```bash
npm install
```

### 构建项目

```bash
# 构建所有包
npm run build

# 单独构建
npm run build:core
npm run build:cli
```

### 开发模式

```bash
# GUI 开发（启动 Electron + Next.js 热更新）
npm run dev:gui

# CLI 开发
npm run dev:cli
```

### 测试

```bash
npm test
```

### 类型检查

```bash
npm run typecheck
```

## 配置

配置文件存储在 `~/.metarr/config.json`，支持以下字段：

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `tmdbKey` | TMDB API Key | - |
| `destPath` | 重命名目标目录 | - |
| `displayLanguage` | 显示语言（`zh` / `en`） | `zh` |
| `preferImdbId` | 电影优先使用 IMDB ID 命名 | `false` |

优先级：函数参数 > 环境变量 `METARR_TMDB_KEY` > 配置文件 > 默认值。

## CLI 使用

```bash
# 重命名电视剧目录
npx metarr rename ./Downloads/Some.Tv.Show -d /Media/TV

# 重命名电影
npx metarr rename ./Movie.File.2024.mkv -t movie -d /Media/Movies

# 预览模式（不实际执行）
npx metarr rename ./Downloads/Show -d /Media --dry-run

# 管理配置
npx metarr config set tmdbKey xxx
npx metarr config show
```

## 代码规范

- **格式化**：Prettier（`singleQuote`, `trailingComma: all`, `printWidth: 100`）
- **类型检查**：`npm run typecheck`
- **提交前**：确保 `npm run typecheck` 和 Prettier 检查通过

详细的开发指南请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。
