# @metarr/gui

Electron 桌面应用，基于 Next.js（静态导出）+ React + Tailwind CSS + shadcn/ui。

## 开发

```bash
npm run dev    # 启动 Next.js (localhost:3000) + Electron（热更新）
```

## 构建

```bash
npm run build           # 完整构建（Next.js 静态导出 + Electron 主进程）
npm run build:next      # 仅构建 Next.js（输出到 out/）
npm run build:main      # 仅构建主进程 + preload（输出到 dist/）
npm run typecheck       # TypeScript 类型检查
```

## 项目结构

```
src/
├── main/
│   └── main.ts         # Electron 主进程（IPC 处理、文件操作）
├── preload/
│   └── preload.ts      # Preload 脚本（contextBridge 安全桥接）
├── shared/
│   └── ipc-types.ts    # IPC 接口类型定义（三端共享）
└── renderer/           # Next.js App Router
    ├── app/            # Next.js 页面入口
    ├── components/
    │   ├── layout/     # 布局组件（侧边栏、设置面板等）
    │   ├── steps/      # 工作流步骤页面（select → execute）
    │   ├── shared/     # 业务共享组件（海报卡片、标签等）
    │   └── ui/         # shadcn/ui 基础组件
    ├── hooks/          # 自定义 hooks（useWorkflow, useConfig, useTheme）
    ├── lib/            # 工具函数（IPC 封装、i18n、工具类）
    └── types/          # Renderer 专属类型
```

## IPC 通信

所有渲染进程与主进程的通信通过 `window.metarrAPI` 进行，类型定义在 `shared/ipc-types.ts`。

新增 IPC channel 时需同步修改三处：
1. `shared/ipc-types.ts` — 接口定义
2. `preload/preload.ts` — contextBridge 映射
3. `main/main.ts` — ipcMain.handle 处理器
