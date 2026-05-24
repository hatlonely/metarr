# 开发指南

## 架构概览

Metarr 采用 npm workspaces monorepo 架构，分为三个包：

| 包 | 职责 | 技术栈 |
|---|------|--------|
| `@metarr/core` | 核心业务逻辑 | TypeScript, Node.js |
| `@metarr/gui` | 桌面应用 | Electron, Next.js, React, Tailwind, shadcn/ui |
| `@metarr/cli` | 命令行工具 | TypeScript, Commander, Inquirer |

## 环境准备

```bash
# 克隆仓库
git clone <repo-url> && cd metarr

# 安装所有依赖
npm install

# 构建核心包（GUI/CLI 的前置依赖）
npm run build:core
```

## 构建系统

### core 包

使用 [tsup](https://tsup.egoist.dev/) 构建，输出 ESM + CJS + 类型声明：

```
dist/
├── index.js      # ESM
├── index.cjs     # CommonJS
├── index.d.ts    # 类型声明 (ESM)
└── index.d.cts   # 类型声明 (CJS)
```

**重要**：修改 `packages/core/src/` 下的代码后，必须重新构建才能在 GUI 中生效：

```bash
npm run build:core
```

因为 Electron 主进程运行的是 `dist/` 下的编译产物，而非 TypeScript 源码。GUI 的 tsconfig 仅将 `@metarr/core` 映射到源码用于类型检查，运行时仍使用编译后的 `dist/`。

### gui 包

分两部分构建：

1. **Renderer**（Next.js 静态导出）：`npm run build:next` → 输出到 `out/`
2. **Main + Preload**（tsup 编译）：`npm run build:main` → 输出到 `dist/`

开发模式下 Next.js 在 `localhost:3000` 运行并支持热更新，Electron 主进程由 tsup 监听编译。

### cli 包

使用 tsup 编译为可执行文件，开发模式下使用 tsx 直接运行 TypeScript。

## 开发命令速查

```bash
# 根目录命令
npm run build              # 构建所有包
npm run build:core         # 仅构建 core
npm run build:cli          # 仅构建 cli
npm run dev:gui            # 启动 GUI 开发模式
npm run dev:cli            # 启动 CLI 开发模式
npm test                   # 运行所有测试
npm run typecheck          # 全部类型检查

# core 包内
cd packages/core
npm run build              # tsup 构建
npm test                   # vitest
npm run test:watch         # vitest 监听模式
npm run typecheck          # tsc --noEmit

# gui 包内
cd packages/gui
npm run dev                # concurrently 启动 Next.js + Electron
npm run build              # 完整构建（Next.js + tsup）
npm run typecheck          # tsc --noEmit（主进程 + 渲染器）
```

## 代码规范

### Prettier

项目使用 Prettier 统一代码风格，配置如下（`.prettierrc`）：

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

格式化检查和修复：

```bash
npx prettier --check "packages/*/src/**/*.ts" "packages/gui/src/**/*.tsx"
npx prettier --write "packages/*/src/**/*.ts" "packages/gui/src/**/*.tsx"
```

### TypeScript

提交前确保类型检查通过：

```bash
npm run typecheck
```

## @metarr/core 详细架构

### 目录结构

```
packages/core/src/
├── index.ts              # 统一导出入口
├── config.ts             # 配置管理（~/.metarr/config.json）
├── parser/
│   ├── dir-parser.ts     # 目录名解析（提取标题、年份等）
│   ├── file-parser.ts    # 文件名解析（提取季/集号、标签等）
│   ├── scanner.ts        # 目录扫描（过滤视频文件）
│   └── tag-parser.ts     # 媒体标签解析（分辨率、编码、音轨等）
├── tmdb/
│   ├── client.ts         # TMDB API 客户端
│   └── errors.ts         # 自定义错误类型
├── renamer/
│   ├── tv-renamer.ts     # 电视剧重命名计划生成
│   ├── movie-renamer.ts  # 电影重命名计划生成
│   ├── executor.ts       # 重命名计划执行器
│   ├── conflict-checker.ts  # 冲突检测
│   └── unmatched-finder.ts  # 未匹配文件发现
└── types/
    ├── media.ts          # 媒体类型定义
    ├── tmdb.ts           # TMDB 类型定义
    └── renamer.ts        # 重命名相关类型定义
```

### 核心类型

| 类型 | 说明 |
|------|------|
| `ParsedMedia` | 解析后的媒体信息（标题、年份、集列表等） |
| `ParsedEpisode` | 单个文件解析结果（原始文件名、季/集号、关联文件等） |
| `TMDBMatch` | TMDB 匹配结果 |
| `TMDBSearchResult` | TMDB 搜索结果项 |
| `RenamePlan` | 重命名计划（任务列表、源路径、目标路径等） |
| `RenameTask` | 单个重命名任务（源 → 目标、操作类型） |
| `ExecutionResult` | 执行结果（成功/失败列表） |
| `ConflictCheckResult` | 冲突检测结果 |

### 数据流

```
文件/目录 → Parser → ParsedMedia → TMDB 搜索 → TMDBMatch → Renamer → RenamePlan → Executor → 结果
```

## @metarr/gui 详细架构

### Electron IPC 架构

```
Renderer (React)          Preload (contextBridge)        Main Process
    │                          │                              │
    │  window.metarrAPI.xxx()  │                              │
    │ ───────────────────────▶ │  ipcRenderer.invoke(...)      │
    │                          │ ────────────────────────────▶│
    │                          │                              │  业务逻辑
    │                          │  ◀────────────────────────────│
    │  ◀───────────────────────│  Promise<result>              │
    │                          │                              │
```

IPC 类型定义在 `packages/gui/src/shared/ipc-types.ts`（`IPCApi` 接口），被 preload、main、renderer 三端共享。

### IPC Channel 列表

| Channel | 方向 | 说明 |
|---------|------|------|
| `dialog:openMedia` | R→M | 打开文件/目录选择对话框 |
| `dialog:openDirectory` | R→M | 打开目录选择对话框 |
| `parse:directory` | R→M | 解析目录 |
| `parse:file` | R→M | 解析文件 |
| `tmdb:search` | R→M | TMDB 搜索 |
| `tmdb:getMovieDetails` | R→M | 获取电影详情（IMDB ID） |
| `rename:generatePlan` | R→M | 生成重命名计划 |
| `rename:checkConflicts` | R→M | 检测冲突 |
| `rename:execute` | R→M | 执行重命名 |
| `unmatched:find` | R→M | 查找未匹配文件 |
| `fs:resolveMediaPath` | R→M | 解析拖拽路径 |
| `config:get` | R→M | 获取全部配置 |
| `config:set` | R→M | 设置配置项 |

### Renderer 组件结构

```
components/
├── layout/
│   ├── app-shell.tsx       # 主布局 + 工作流状态管理
│   ├── sidebar.tsx         # 侧边栏导航
│   ├── sidebar-step.tsx    # 步骤导航项
│   ├── content-area.tsx    # 内容区域容器
│   └── settings-sheet.tsx  # 设置面板
├── steps/
│   ├── step-select.tsx     # 步骤1：选择媒体
│   ├── step-parse.tsx      # 步骤2：解析结果
│   ├── step-search.tsx     # 步骤3：搜索匹配
│   ├── step-preview.tsx    # 步骤4：预览计划
│   └── step-execute.tsx    # 步骤5：执行结果
├── shared/
│   ├── step-header.tsx     # 步骤页头
│   ├── poster-card.tsx     # 搜索结果海报卡片
│   ├── path-display.tsx    # 路径显示
│   ├── tag-badge.tsx       # 媒体标签
│   └── error-banner.tsx    # 错误提示
└── ui/                     # shadcn/ui 基础组件（不建议直接修改）
```

### 状态管理

使用 `useWorkflow` 自定义 hook（基于 `useReducer`），管理 5 步工作流的状态流转：

```
select → parse → search → preview → execute
```

定义在 `packages/gui/src/renderer/hooks/use-workflow.ts`。

### 国际化 (i18n)

翻译定义在 `packages/gui/src/renderer/lib/i18n.ts`，支持 `zh`（中文）和 `en`（英文）。

添加新文案时，需要同时在 `zh` 和 `en` 两个对象中添加对应字段，并更新 `TranslationMap` 类型。

## @metarr/cli 详细架构

```
packages/cli/src/
├── bin.ts                  # 入口（Commander 命令注册）
├── commands/
│   ├── rename.ts           # rename 命令逻辑
│   └── config.ts           # config 命令逻辑
```

## 常见问题

### 修改 core 代码后 GUI 没有生效？

需要重新构建 core 包：

```bash
npm run build:core
```

然后重启 GUI 开发服务器（`npm run dev:gui`）。

### TypeScript 报类型错误但运行正常？

可能是 core 包的类型声明文件过期。运行 `npm run build:core` 重新生成 `.d.ts` 文件。

### 添加新的 IPC Channel

1. 在 `shared/ipc-types.ts` 的 `IPCApi` 接口中添加方法签名
2. 在 `preload/preload.ts` 中添加 `contextBridge` 映射
3. 在 `main/main.ts` 中添加 `ipcMain.handle` 处理器
4. 在 `renderer/lib/ipc.ts` 中添加类型安全的调用函数

### 添加新的 UI 组件

基础组件使用 shadcn/ui（`npx shadcn@latest add <component>`），会自动安装到 `components/ui/` 目录。业务组件放在 `steps/` 或 `shared/` 目录。
