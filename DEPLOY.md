# 部署指南

Metarr 的三个产品分别通过不同渠道分发：

| 产品 | 分发渠道 | 触发方式 |
|------|----------|----------|
| GUI（桌面应用） | GitHub Releases | 推送 `v*` tag |
| CLI（命令行工具） | npm | changesets 自动发布 |
| Web（官方网站） | Cloudflare Pages | 推送到 master（web 目录有变更时） |

## 前置配置

以下 GitHub Secrets 需要提前配置：

```bash
# Cloudflare Pages 部署
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID

# npm 发布
gh secret set NPM_TOKEN
```

### 获取 CLOUDFLARE_API_TOKEN

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. My Profile → API Tokens → Create Token
3. 使用 "Edit Cloudflare Workers" 模板，或自定义以下权限：
   - Account - Cloudflare Pages - Edit
   - Account - Account Settings - Read
   - Account - Memberships - Read
4. 创建后复制 token

### 获取 CLOUDFLARE_ACCOUNT_ID

在 Cloudflare Dashboard 右侧栏或 URL 中可以看到 Account ID。

### 获取 NPM_TOKEN

1. 登录 [npmjs.com](https://www.npmjs.com)
2. 头像 → Access Tokens → Generate New Token → Granular Access Token
3. 设置 Token name，Packages 选 "Read and write"
4. 创建后复制 token

---

## GUI 发布（GitHub Releases）

### 自动构建流程

推送 `v*` 格式的 tag 到 master 后自动触发（`.github/workflows/release.yml`）：

```
推送 tag → 构建 macOS(windows) 安装包 → 上传到 GitHub Releases
```

构建产物：

| 平台 | 格式 |
|------|------|
| macOS | .dmg, .zip |
| Windows | .exe (NSIS 安装器), .exe (便携版) |

### 发布步骤

```bash
# 1. 确保代码已合并到 master
git checkout master && git pull

# 2. 更新版本号（三选一）
npm version patch    # v0.1.0 → v0.1.1（修复）
npm version minor    # v0.1.0 → v0.2.0（新功能）
npm version major    # v0.1.0 → v1.0.0（破坏性变更）

# 3. 推送 tag 触发构建
git push && git push --tags
```

`npm version` 会自动更新 `package.json` 中的版本号、创建 git commit 和 tag。

### 本地构建（调试用）

```bash
# 构建当前平台的安装包
cd packages/gui
npm run pack

# 产物在 packages/gui/release/ 目录下
```

### 配置说明

构建配置在 `packages/gui/electron-builder.yml`：

```yaml
appId: com.metarr.app
productName: Metarr
electronVersion: 35.0.0
```

---

## CLI 发布（npm）

### 发布机制

使用 [changesets](https://github.com/changesets/changesets) 管理 npm 包的版本和发布。参与发布的包：

- `@metarr/core` — 核心库
- `@metarr/cli` — 命令行工具

`@metarr/gui` 和 `@metarr/web` 是私有包，不参与发布（已配置 ignore）。

### 自动化流程

```
开发者提交 changeset → 推送到 master
    ↓
changesets bot 创建 "Version Packages" PR（自动更新版本号 + CHANGELOG）
    ↓
开发者合并该 PR
    ↓
GitHub Actions 自动 npm publish + 打 tag
```

### 发布步骤

```bash
# 1. 改完代码后，创建变更记录
npx changeset
# 按提示选择：
#   - 变更的包：@metarr/cli / @metarr/core
#   - 版本级别：patch / minor / major
#   - 变更说明：简要描述改了什么

# 2. 提交并推送
git add . && git commit -m "feat: xxx" && git push

# 3. 等待 changesets bot 创建 "Version Packages" PR
# 4. 审核版本号和 CHANGELOG 无误后，合并该 PR

# 5. 合并后自动发布到 npm
```

### 用户安装方式

```bash
# 全局安装
npm install -g @metarr/cli

# 或免安装直接使用
npx @metarr/cli rename /path/to/media
```

### 配置说明

changesets 配置在 `.changeset/config.json`：

```json
{
  "access": "public",
  "baseBranch": "master",
  "ignore": ["@metarr/gui", "@metarr/web"]
}
```

---

## Web 部署（Cloudflare Pages）

### 自动部署流程

推送到 master 且 `packages/web/**` 目录有变更时自动触发（`.github/workflows/deploy-web.yml`）：

```
推送代码 → 构建 Next.js 静态站点 → 部署到 Cloudflare Pages
```

网站地址：https://metarr.pages.dev

也支持手动触发：在 GitHub Actions 页面选择 `deploy-web` workflow → Run workflow。

### 本地开发

```bash
npm run dev:web    # http://localhost:3001
```

### 本地构建

```bash
npm run build:web  # 输出到 packages/web/dist/
```

---

## 文件结构

```
.github/workflows/
├── release.yml        # GUI + Web 构建，tag 触发
├── deploy-web.yml     # Web 部署到 Cloudflare Pages，push 触发
└── changesets.yml     # npm 包版本管理 + 发布

.changeset/
├── config.json        # changesets 配置
└── *.md               # 变更记录文件（每次 npx changeset 生成）
```
