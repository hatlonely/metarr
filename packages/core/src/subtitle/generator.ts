import { basename } from 'node:path';
import type { TMDBMatch } from '../types/tmdb.js';
import type { RenamePlan } from '../types/renamer.js';
import { SubDLClient } from './subdl.js';
import { AssrtClient } from './assrt.js';
import { LANGUAGE_CONFIG, ASSRT_DESC_TO_LANG } from './types.js';
import type { SubtitleTask, SubtitlePlan } from './types.js';

export interface SubtitleOptions {
  subdlApiKey?: string;
  assrtToken?: string;
  languages: string[];
}

function parseSE(fileName: string): { season: number; episode: number } | null {
  const m = fileName.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
  if (!m) return null;
  return { season: parseInt(m[1], 10), episode: parseInt(m[2], 10) };
}

function subtitlePath(videoTarget: string, suffix: string, ext: string): string {
  return videoTarget.replace(/\.[^.]+$/, `.${suffix}.${ext}`);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export async function generateSubtitlePlan(
  tmdbMatch: TMDBMatch,
  plan: RenamePlan,
  options: SubtitleOptions,
): Promise<SubtitlePlan> {
  if (!options.subdlApiKey && !options.assrtToken) return { tasks: [] };

  const subdl = options.subdlApiKey ? new SubDLClient(options.subdlApiKey) : null;
  const assrt = options.assrtToken ? new AssrtClient(options.assrtToken) : null;

  const subdlCodes = options.languages
    .map(l => LANGUAGE_CONFIG[l]?.subdlCode)
    .filter(Boolean)
    .join(',');

  const name = tmdbMatch.displayName || tmdbMatch.originalName;
  const renameTasks = plan.tasks.filter(t => t.operation === 'rename');
  const tasks: SubtitleTask[] = [];
  // Track used target paths to avoid duplicate subtitle files
  const usedPaths = new Set<string>();

  const addTask = (task: SubtitleTask) => {
    if (usedPaths.has(task.targetPath)) return;
    usedPaths.add(task.targetPath);
    tasks.push(task);
  };

  if (tmdbMatch.type === 'movie') {
    const videoTask = renameTasks[0];
    if (!videoTask) return { tasks: [] };

    if (subdl && subdlCodes) {
      const results = await subdl.search({ tmdbId: tmdbMatch.id, type: 'movie', languages: subdlCodes }).catch(() => []);
      for (const sub of results.filter(s => !s.zipDownload).slice(0, 3)) {
        const langKey = sub.language;
        const langMeta = LANGUAGE_CONFIG[langKey];
        if (!langMeta || !options.languages.includes(langKey)) continue;
        const ext = sub.url.split('.').pop() ?? 'srt';
        addTask({
          source: 'subdl', language: langKey, languageDisplay: langMeta.display,
          format: ext, releaseName: sub.release_name, downloadCount: sub.download_count,
          resolveInfo: { kind: 'subdl', downloadUrl: subdl.downloadUrl(sub.url) },
          targetPath: subtitlePath(videoTask.target, langMeta.suffix, ext),
          description: `${langMeta.display} (SubDL)`,
        });
      }
    }

    if (assrt && options.languages.some(l => l.startsWith('zh'))) {
      const results = await assrt.search(`${name} ${tmdbMatch.year}`).catch(() => []);
      for (const sub of results.slice(0, 2)) {
        const langKey = ASSRT_DESC_TO_LANG[sub.lang?.desc ?? ''] ?? 'zh';
        if (!options.languages.includes(langKey)) continue;
        const langMeta = LANGUAGE_CONFIG[langKey];
        if (!langMeta) continue;
        const ext = sub.subtype || 'srt';
        addTask({
          source: 'assrt', language: langKey, languageDisplay: sub.lang?.desc || langMeta.display,
          format: ext, releaseName: sub.native_name || sub.videoname, downloadCount: 0,
          resolveInfo: { kind: 'assrt', subId: sub.id, token: assrt.token },
          targetPath: subtitlePath(videoTask.target, langMeta.suffix, ext),
          description: `${sub.lang?.desc || langMeta.display} (Assrt)`,
        });
      }
    }
  } else {
    for (const task of renameTasks) {
      const se = parseSE(basename(task.source));
      if (!se) continue;
      const epLabel = `S${pad2(se.season)}E${pad2(se.episode)}`;

      if (subdl && subdlCodes) {
        const results = await subdl.search({
          tmdbId: tmdbMatch.id, type: 'tv',
          season: se.season, episode: se.episode,
          languages: subdlCodes,
        }).catch(() => []);

        for (const sub of results.filter(s => !s.zipDownload).slice(0, 2)) {
          const langKey = sub.language;
          const langMeta = LANGUAGE_CONFIG[langKey];
          if (!langMeta || !options.languages.includes(langKey)) continue;
          const ext = sub.url.split('.').pop() ?? 'srt';
          addTask({
            source: 'subdl', language: langKey, languageDisplay: langMeta.display,
            format: ext, releaseName: sub.release_name, downloadCount: sub.download_count,
            resolveInfo: { kind: 'subdl', downloadUrl: subdl.downloadUrl(sub.url) },
            targetPath: subtitlePath(task.target, langMeta.suffix, ext),
            description: `${epLabel} ${langMeta.display} (SubDL)`,
          });
        }
      }

      if (assrt && options.languages.some(l => l.startsWith('zh'))) {
        const results = await assrt.search(`${name} ${epLabel}`).catch(() => []);
        for (const sub of results.slice(0, 1)) {
          const langKey = ASSRT_DESC_TO_LANG[sub.lang?.desc ?? ''] ?? 'zh';
          if (!options.languages.includes(langKey)) continue;
          const langMeta = LANGUAGE_CONFIG[langKey];
          if (!langMeta) continue;
          const ext = sub.subtype || 'srt';
          addTask({
            source: 'assrt', language: langKey, languageDisplay: sub.lang?.desc || langMeta.display,
            format: ext, releaseName: sub.native_name || sub.videoname, downloadCount: 0,
            resolveInfo: { kind: 'assrt', subId: sub.id, token: assrt.token },
            targetPath: subtitlePath(task.target, langMeta.suffix, ext),
            description: `${epLabel} ${sub.lang?.desc || langMeta.display} (Assrt)`,
          });
        }
      }
    }
  }

  return { tasks };
}
