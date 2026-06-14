import { basename } from 'node:path';
import type { TMDBMatch } from '../types/tmdb.js';
import type { RenamePlan, RenameTask } from '../types/renamer.js';
import { SubDLClient } from './subdl.js';
import type { SubDLSubtitle } from './subdl.js';
import { AssrtClient, assrtLangsOf } from './assrt.js';
import type { AssrtSearchSub } from './assrt.js';
import { LANGUAGE_CONFIG, SUBDL_CODE_TO_LANG } from './types.js';
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

/**
 * Convert a SubDL search result into a task, mapping its uppercase language code
 * to a canonical key. SubDL serves ZIP archives, so the real extension is only
 * known after extraction — default to .srt; the executor rewrites it if needed.
 */
function subdlToTask(
  sub: SubDLSubtitle,
  videoTarget: string,
  subdl: SubDLClient,
  allowedLangs: string[],
  prefix: string,
): SubtitleTask | null {
  const langKey = SUBDL_CODE_TO_LANG[sub.language];
  if (!langKey || !allowedLangs.includes(langKey)) return null;
  const langMeta = LANGUAGE_CONFIG[langKey];
  return {
    source: 'subdl',
    language: langKey,
    languageDisplay: langMeta.display,
    format: 'srt',
    releaseName: sub.release_name,
    downloadCount: 0,
    resolveInfo: { kind: 'subdl', downloadUrl: subdl.downloadUrl(sub.url) },
    targetPath: subtitlePath(videoTarget, langMeta.suffix, 'srt'),
    description: `${prefix}${langMeta.display} (SubDL)`,
  };
}

/**
 * Expand an Assrt search result into tasks — one per requested language the
 * result provides (per its langlist flags). Archives may be season packs, so
 * season/episode hints are carried for the executor to pick the right file.
 */
function assrtToTasks(
  sub: AssrtSearchSub,
  videoTarget: string,
  token: string,
  allowedLangs: string[],
  se: { season: number; episode: number } | null,
  prefix: string,
): SubtitleTask[] {
  const available = assrtLangsOf(sub.lang?.langlist);
  const out: SubtitleTask[] = [];
  for (const langKey of available) {
    if (!allowedLangs.includes(langKey)) continue;
    const langMeta = LANGUAGE_CONFIG[langKey];
    if (!langMeta) continue;
    out.push({
      source: 'assrt',
      language: langKey,
      languageDisplay: langMeta.display,
      format: 'srt',
      releaseName: sub.native_name || sub.videoname,
      downloadCount: 0,
      resolveInfo: {
        kind: 'assrt',
        subId: sub.id,
        token,
        season: se?.season,
        episode: se?.episode,
        language: langKey,
      },
      targetPath: subtitlePath(videoTarget, langMeta.suffix, 'srt'),
      description: `${prefix}${langMeta.display} (Assrt)`,
    });
  }
  return out;
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
    .map((l) => LANGUAGE_CONFIG[l]?.subdlCode)
    .filter(Boolean)
    .join(',');

  const name = tmdbMatch.displayName || tmdbMatch.originalName;
  const renameTasks = plan.tasks.filter((t) => t.operation === 'rename');
  const tasks: SubtitleTask[] = [];
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
      const results = await subdl
        .search({ tmdbId: tmdbMatch.id, type: 'movie', languages: subdlCodes })
        .catch(() => []);
      for (const sub of results) {
        const task = subdlToTask(sub, videoTask.target, subdl, options.languages, '');
        if (task) addTask(task);
      }
    }

    if (assrt) {
      const results = await assrt.search(`${name} ${tmdbMatch.year}`).catch(() => []);
      for (const sub of results) {
        for (const task of assrtToTasks(sub, videoTask.target, assrt.token, options.languages, null, '')) {
          addTask(task);
        }
      }
    }
  } else {
    // SubDL: per-episode search (SubDL indexes per episode).
    if (subdl && subdlCodes) {
      for (const task of renameTasks) {
        const se = parseSE(basename(task.source));
        if (!se) continue;
        const epLabel = `S${pad2(se.season)}E${pad2(se.episode)}`;
        const results = await subdl
          .search({
            tmdbId: tmdbMatch.id,
            type: 'tv',
            season: se.season,
            episode: se.episode,
            languages: subdlCodes,
          })
          .catch(() => []);
        for (const sub of results) {
          const subTask = subdlToTask(sub, task.target, subdl, options.languages, `${epLabel} `);
          if (subTask) addTask(subTask);
        }
      }
    }

    // Assrt: one search per season (archives are usually season packs); reuse
    // results across that season's episodes, letting the executor pick by episode.
    if (assrt) {
      const episodesBySeason = new Map<number, RenameTask[]>();
      for (const task of renameTasks) {
        const se = parseSE(basename(task.source));
        if (!se) continue;
        if (!episodesBySeason.has(se.season)) episodesBySeason.set(se.season, []);
        episodesBySeason.get(se.season)!.push(task);
      }

      for (const [season, epTasks] of episodesBySeason) {
        const results = await assrt.search(`${name} S${pad2(season)}`).catch(() => []);
        if (results.length === 0) continue;
        for (const task of epTasks) {
          const se = parseSE(basename(task.source))!;
          const epLabel = `S${pad2(se.season)}E${pad2(se.episode)}`;
          for (const sub of results) {
            for (const t of assrtToTasks(sub, task.target, assrt.token, options.languages, se, `${epLabel} `)) {
              addTask(t);
            }
          }
        }
      }
    }
  }

  return { tasks };
}
