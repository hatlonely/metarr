'use client';

import { useState, useCallback } from 'react';
import type { ParsedMedia, TMDBMatch, RenamePlan, RenameTask } from '@metarr/core';

type Stage = 'settings' | 'select' | 'parse' | 'search' | 'preview' | 'execute';

export default function Home() {
  const [stage, setStage] = useState<Stage>('settings');
  const [apiKey, setApiKey] = useState('');
  const [destPath, setDestPath] = useState('');
  const [titleLang, setTitleLang] = useState<'zh' | 'en'>('zh');
  const [mediaType, setMediaType] = useState<'tv' | 'movie' | 'auto'>('auto');

  // Parse results
  const [parsed, setParsed] = useState<ParsedMedia | null>(null);
  const [sourcePath, setSourcePath] = useState('');

  // TMDB search results
  const [tmdbResults, setTmdbResults] = useState<TMDBMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<TMDBMatch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Rename plan
  const [plan, setPlan] = useState<RenamePlan | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{ succeeded: number; failed: number } | null>(null);

  // Error
  const [error, setError] = useState('');

  const api = typeof window !== 'undefined' ? window.metarrAPI : null;

  // Load saved config
  useState(() => {
    if (!api) return;
    api.getConfig().then((cfg) => {
      if (cfg.apiKey) setApiKey(cfg.apiKey as string);
      if (cfg.destPath) setDestPath(cfg.destPath as string);
      if (cfg.titleLang) setTitleLang(cfg.titleLang as 'zh' | 'en');
    });
  });

  // Save config
  const saveConfig = useCallback(
    async (key: string, value: unknown) => {
      if (!api) return;
      await api.setConfig(key, value);
    },
    [api],
  );

  // Step 1: Save settings and go to directory selection
  const handleSaveSettings = async () => {
    await saveConfig('apiKey', apiKey);
    await saveConfig('destPath', destPath);
    await saveConfig('titleLang', titleLang);
    if (!destPath) {
      setError('请设置目标目录');
      return;
    }
    setError('');
    setStage('select');
  };

  // Step 2: Select and parse directory
  const handleSelectDirectory = async () => {
    if (!api) return;
    setError('');
    try {
      const dirPath = await api.openDirectory();
      if (!dirPath) return;
      setSourcePath(dirPath);
      const result = await api.parseDirectory(dirPath, mediaType === 'auto' ? undefined : mediaType);
      setParsed(result);
      setSearchQuery(result.chineseTitle || result.englishTitle || '');
      if (result.type !== 'unknown') {
        setMediaType(result.type === 'tv' ? 'tv' : 'movie');
      }
      setStage('parse');
    } catch (err) {
      setError(`解析失败: ${(err as Error).message}`);
    }
  };

  // Step 3: Search TMDB
  const handleTmdbSearch = async (query?: string) => {
    if (!api || !apiKey) return;
    setError('');
    const q = query || searchQuery;
    if (!q) return;
    try {
      const type = mediaType === 'auto' ? (parsed?.type === 'movie' ? 'movie' : 'tv') : mediaType;
      const results = await api.tmdbSearch(apiKey, q, type, parsed?.year);
      setTmdbResults(results);
      setSelectedMatch(null);
      setStage('search');
    } catch (err) {
      setError(`搜索失败: ${(err as Error).message}`);
    }
  };

  // Step 4: Select match and get IMDB ID for movies
  const handleSelectMatch = async (match: TMDBMatch) => {
    if (!api || !apiKey) return;
    setSelectedMatch(match);
    // For movies, get IMDB ID
    if (match.type === 'movie') {
      try {
        const details = await api.tmdbGetMovieDetails(apiKey, match.id);
        if (details.imdb_id) {
          match.imdbId = details.imdb_id;
        }
      } catch {
        // Ignore
      }
    }
  };

  // Step 5: Generate rename plan
  const handleGeneratePlan = async () => {
    if (!api || !parsed || !selectedMatch || !destPath) return;
    setError('');
    try {
      const newPlan = await api.generateRenamePlan(parsed, selectedMatch, {
        destPath,
        dryRun: false,
        preferImdbId: true,
      });
      setPlan(newPlan);
      setStage('preview');
    } catch (err) {
      setError(`生成计划失败: ${(err as Error).message}`);
    }
  };

  // Step 6: Execute rename
  const handleExecute = async () => {
    if (!api || !plan) return;
    setError('');
    setExecuting(true);
    try {
      const result = await api.executeRename(plan);
      setExecResult({ succeeded: result.succeeded.length, failed: result.failed.length });
      setStage('execute');
    } catch (err) {
      setError(`执行失败: ${(err as Error).message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setStage('select');
    setParsed(null);
    setTmdbResults([]);
    setSelectedMatch(null);
    setPlan(null);
    setExecResult(null);
    setError('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Metarr</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stage: Settings */}
      {stage === 'settings' && (
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">TMDB API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入 TMDB API Key"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">目标目录</label>
            <input
              type="text"
              value={destPath}
              onChange={(e) => setDestPath(e.target.value)}
              placeholder="/path/to/media/library"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">标题语言</label>
            <select
              value={titleLang}
              onChange={(e) => setTitleLang(e.target.value as 'zh' | 'en')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <button
            onClick={handleSaveSettings}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            保存并继续
          </button>
        </div>
      )}

      {/* Stage: Select Directory */}
      {stage === 'select' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">选择源目录</h2>
          <p className="text-gray-500">
            选择需要重命名的影视目录（电视剧或电影）
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSelectDirectory}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              选择目录
            </button>
            <button
              onClick={() => setStage('settings')}
              className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              设置
            </button>
          </div>
        </div>
      )}

      {/* Stage: Parse Results */}
      {stage === 'parse' && parsed && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">解析结果</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">源目录: </span>
                <span className="font-mono text-xs">{parsed.originalDirName}</span>
              </div>
              <div>
                <span className="text-gray-500">类型: </span>
                <span>{parsed.type === 'tv' ? '电视剧' : parsed.type === 'movie' ? '电影' : '未知'}</span>
              </div>
              <div>
                <span className="text-gray-500">中文标题: </span>
                <span className="font-medium">{parsed.chineseTitle || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">英文标题: </span>
                <span className="font-medium">{parsed.englishTitle || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">年份: </span>
                <span>{parsed.year || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">文件数: </span>
                <span>{parsed.episodes.length}</span>
              </div>
            </div>
            {(parsed.tags.resolution || parsed.tags.codec) && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {parsed.tags.resolution && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {parsed.tags.resolution}
                  </span>
                )}
                {parsed.tags.codec && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                    {parsed.tags.codec}
                  </span>
                )}
                {parsed.tags.isDV && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    Dolby Vision
                  </span>
                )}
                {parsed.tags.audioCodec && (
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    {parsed.tags.audioCodec}
                  </span>
                )}
              </div>
            )}
          </div>

          <h3 className="mt-6 text-lg font-semibold">TMDB 搜索</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
              placeholder="搜索关键词"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={() => handleTmdbSearch()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              搜索
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('select')}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              返回
            </button>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as 'tv' | 'movie' | 'auto')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="auto">自动检测</option>
              <option value="tv">电视剧</option>
              <option value="movie">电影</option>
            </select>
          </div>

          {stage === 'parse' && tmdbResults.length === 0 && (
            <p className="text-sm text-gray-400">按回车或点击搜索按钮搜索 TMDB</p>
          )}
        </div>
      )}

      {/* Stage: TMDB Search Results */}
      {stage === 'search' && tmdbResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">选择匹配项</h2>
          <div className="space-y-3">
            {tmdbResults.map((match) => (
              <button
                key={match.id}
                onClick={() => handleSelectMatch(match)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedMatch?.id === match.id
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {match.posterUrl && (
                    <img
                      src={match.posterUrl}
                      alt=""
                      className="h-24 w-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      {match.zhName || match.enName} ({match.year})
                    </div>
                    {match.zhName && match.enName && match.zhName !== match.enName && (
                      <div className="text-sm text-gray-500">{match.enName}</div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      [tmdbid-{match.id}]
                      {match.imdbId && ` [imdbid-${match.imdbId}]`}
                    </div>
                    {match.overview && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {match.overview}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('parse')}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              返回
            </button>
            <button
              onClick={() => handleTmdbSearch(searchQuery)}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              重新搜索
            </button>
            {selectedMatch && (
              <button
                onClick={handleGeneratePlan}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                生成重命名计划
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stage: Preview */}
      {stage === 'preview' && plan && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">重命名计划</h2>
          <p className="text-sm text-gray-500">{plan.summary}</p>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">操作</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">路径</th>
                </tr>
              </thead>
              <tbody>
                {plan.tasks.map((task, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {task.operation === 'create-dir' ? (
                        <span className="text-green-600">+ 创建目录</span>
                      ) : (
                        <span className="text-blue-600">重命名</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {task.operation === 'create-dir'
                        ? task.target.replace(plan.destPath + '/', '')
                        : task.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('search')}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              返回
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {executing ? '执行中...' : '确认执行'}
            </button>
          </div>
        </div>
      )}

      {/* Stage: Execute Result */}
      {stage === 'execute' && execResult && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">执行完成</h2>
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
            <div className="text-4xl font-bold text-green-600">{execResult.succeeded}</div>
            <div className="text-green-600">操作成功</div>
            {execResult.failed > 0 && (
              <div className="mt-2 text-red-500">
                {execResult.failed} 个操作失败
              </div>
            )}
          </div>
          <button
            onClick={handleReset}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            继续处理
          </button>
        </div>
      )}
    </div>
  );
}
