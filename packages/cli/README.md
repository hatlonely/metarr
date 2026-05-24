# @metarr/cli

命令行工具，提供 `metarr` 命令。

## 开发

```bash
npm run dev        # tsx 直接运行 TypeScript
```

## 构建

```bash
npm run build      # tsup 编译 → dist/bin.js
```

## 使用

```bash
# 重命名影视文件/目录
metarr rename <source> [options]

# 选项
  -d, --dest <path>     目标父目录（默认当前目录）
  -t, --type <type>     媒体类型：tv / movie / auto（默认 auto）
  --dry-run             预览模式，不实际执行
  --tmdb-key <key>      TMDB API Key（也可设置 METARR_TMDB_KEY 环境变量）
  --lang <lang>         显示语言：zh / en
  --no-imdb             电影不优先使用 IMDB ID

# 配置管理
metarr config set <key> <value>    设置配置项
metarr config show                 查看当前配置
```
