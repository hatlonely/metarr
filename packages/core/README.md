# @metarr/core

核心业务库，提供媒体文件解析、TMDB 元数据获取、重命名计划生成与执行等功能。

## 导出 API

### Parser

```typescript
import { parseMediaDir, parseMediaFile, scanDirectory } from '@metarr/core';

// 解析目录（自动扫描视频文件）
const parsed = await parseMediaDir('/path/to/media', { type: 'tv' });
// parsed.title, parsed.year, parsed.episodes[] 等

// 解析单个文件
const parsed = await parseMediaFile('/path/to/episode.mkv');

// 扫描目录（仅列出视频文件）
const files = await scanDirectory('/path/to/media');
```

### TMDB

```typescript
import { TMDBClient } from '@metarr/core';

const client = new TMDBClient({ apiKey: 'xxx', language: 'zh-CN' });

// 模糊搜索
const results = await client.fuzzySearch('Breaking Bad', 'tv', 2008);

// 获取电影详情（用于获取 IMDB ID）
const details = await client.getMovieDetails(155);
// details.imdb_id
```

### Renamer

```typescript
import {
  generateTvRenamePlan,
  generateMovieRenamePlan,
  executeRenamePlan,
  checkConflicts,
  findUnmatchedFiles,
} from '@metarr/core';

// 生成重命名计划
const plan = await generateTvRenamePlan(parsedMedia, tmdbMatch, {
  destPath: '/Media/TV',
  dryRun: false,
  preferImdbId: false,
});

// 检测冲突
const conflicts = await checkConflicts(plan);
// conflicts.hasConflicts, conflicts.conflicts[]

// 执行重命名
const result = await executeRenamePlan(plan, resolutions, filesToRemove);
// result.succeeded[], result.failed[], result.cleanedSourcePath

// 查找未匹配文件
const unmatched = await findUnmatchedFiles(sourcePath, plan);
```

### Config

```typescript
import { getConfig, setConfig, getAllConfig, getTmdbKey } from '@metarr/core';

// 读取配置（优先级：参数 > 环境变量 > 配置文件）
const key = getTmdbKey('explicit-key');

// 读写配置
setConfig('destPath', '/Media');
const config = getAllConfig();
```

## 类型说明

| 类型 | 说明 |
|------|------|
| `ParsedMedia` | 解析后的媒体信息 |
| `ParsedEpisode` | 单个文件解析结果 |
| `MediaType` | `'tv' \| 'movie' \| 'unknown'` |
| `MediaTags` | 分辨率、编码、HDR 等标签 |
| `TMDBMatch` | TMDB 匹配结果（含标题、年份、季信息等） |
| `TMDBSearchResult` | TMDB 搜索结果列表项 |
| `RenamePlan` | 完整重命名计划 |
| `RenameTask` | 单个重命名/移动任务 |
| `RenamePlanSummary` | 计划摘要（名称、类型、文件数） |
| `ExecutionResult` | 执行结果 |
| `FileConflict` | 文件冲突信息 |
| `ConflictResolutionMap` | 冲突处理策略映射 |
| `UnmatchedFileInfo` | 未匹配文件信息 |

## 构建

```bash
npm run build        # tsup 编译 → dist/
npm run typecheck    # TypeScript 类型检查
npm test             # vitest 单元测试
```
