import { basename } from 'node:path';
import { parseMediaDir, parseMediaFile } from '../parser/index.js';
import { parseAlbumDir } from '../parser/audio-parser.js';
import { scanDirectory } from '../parser/scanner.js';
import type { TMDBClient } from '../tmdb/client.js';
import { locate } from '../tmdb/locate.js';
import type { MusicBrainzClient } from '../musicbrainz/client.js';
import { locateReleases } from '../musicbrainz/locate.js';
import { localizeAlbum, localizeRelease, type TitleScript } from '../musicbrainz/localize.js';
import { fetchAlbumCover } from '../musicbrainz/cover-art.js';
import { generateRenamePlan } from '../renamer/index.js';
import { generateMusicRenamePlan } from '../renamer/music-renamer.js';
import type { TMDBMatch } from '../types/tmdb.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import type { ParsedMedia, ExtractResult } from '../types/media.js';
import { assessVideo, assessMusic } from './confidence.js';
import type { BatchItem, BatchCandidate, ConfidenceLevel } from './types.js';

export interface AnalyzeContext {
  tmdbClient: TMDBClient;
  mbClient: MusicBrainzClient;
  language?: string;
  preferLang?: 'zh' | 'en';
  titleScript?: TitleScript;
  destPath: string;
  preferImdbId?: boolean;
  namingPreset?: string;
}

const statusFor = (level: ConfidenceLevel) =>
  level === 'high' ? 'auto' : level === 'low' ? 'review' : 'nomatch';

/**
 * A plan is a no-op when the files are already in their final location with
 * their final names — every rename has source === target. Such items need no
 * action (executing them changes nothing and records no history), so they are
 * surfaced as 'organized' instead of 'auto'/'review'.
 */
export function isAlreadyOrganized(plan: BatchItem['plan']): boolean {
  if (!plan) return false;
  const renames = plan.tasks.filter((t) => t.operation === 'rename');
  return renames.length > 0 && renames.every((t) => t.source === t.target);
}

const itemStatus = (level: ConfidenceLevel, plan: BatchItem['plan']): BatchItem['status'] =>
  isAlreadyOrganized(plan) ? 'organized' : statusFor(level);

function tmdbCandidate(m: TMDBMatch): BatchCandidate {
  return {
    id: String(m.id),
    title: m.displayName,
    year: m.year > 0 ? m.year : undefined,
    subtitle: m.originalName && m.originalName !== m.displayName ? m.originalName : undefined,
    meta: m.imdbId ? [`TMDB ${m.id}`, `IMDB ${m.imdbId}`] : [`TMDB ${m.id}`],
    poster: m.posterUrl,
    score: m.matchScore ?? 0,
  };
}

function releaseCandidate(r: MusicBrainzRelease): BatchCandidate {
  return {
    id: r.mbid,
    title: `${r.artist} - ${r.title}`,
    year: r.year,
    meta: r.discCount > 1 ? [`${r.trackCount} 轨`, `${r.discCount} 碟`] : [`${r.trackCount} 轨`],
    poster: r.coverUrl,
    score: r.matchScore ?? 0,
  };
}

async function buildMusicItem(dir: string, ctx: AnalyzeContext, signature: string): Promise<BatchItem> {
  const album = await parseAlbumDir(dir);
  const releases = await locateReleases(ctx.mbClient, album, {
    limit: 6, preferLang: ctx.preferLang, titleScript: ctx.titleScript,
  });
  const { level, reason } = assessMusic(releases, { year: album.year, trackCount: album.tracks.length });
  const chosen = level === 'none' ? null : releases[0];
  if (chosen) chosen.coverUrl = await fetchAlbumCover(chosen.artist, chosen.title);
  const a = ctx.titleScript ? await localizeAlbum(album, ctx.titleScript) : album;
  const r = chosen && ctx.titleScript ? await localizeRelease(chosen, ctx.titleScript) : chosen;
  const plan = generateMusicRenamePlan(a, r, { destPath: ctx.destPath, namingPreset: ctx.namingPreset });
  return {
    id: dir, sourcePath: dir, kind: 'music', level, reason, status: itemStatus(level, plan),
    title: plan.mediaSummary?.name ?? album.album ?? basename(dir),
    year: plan.mediaSummary?.year, poster: chosen?.coverUrl,
    targetPath: plan.tasks.find((t) => t.operation === 'create-dir')?.target,
    candidates: releases.map(releaseCandidate), chosenId: chosen ? chosen.mbid : null,
    plan, parsedAlbum: album, musicReleases: releases, signature,
  };
}

async function buildVideoItem(
  parsed: ParsedMedia,
  idPath: string,
  ctx: AnalyzeContext,
  signature: string,
  forceType?: 'movie' | 'tv',
): Promise<BatchItem> {
  const type = forceType ?? (parsed.type === 'tv' || parsed.type === 'movie' ? parsed.type : undefined);
  const extract: ExtractResult = {
    ids: parsed.ids ?? {},
    mediaType: parsed.type,
    episodes: parsed.episodes,
    tags: parsed.tags,
    titleCandidates: parsed.titleCandidates ?? [],
    yearCandidates: parsed.yearCandidates ?? (parsed.year ? [parsed.year] : []),
    originalName: parsed.originalDirName,
  };
  const matches = await locate(ctx.tmdbClient, extract, { type, year: parsed.year });
  const { level, reason } = assessVideo(matches, { year: parsed.year });
  const chosen = level === 'none' ? null : matches[0];
  const plan = chosen
    ? generateRenamePlan(parsed, chosen, {
        destPath: ctx.destPath, preferImdbId: ctx.preferImdbId ?? true, namingPreset: ctx.namingPreset,
      })
    : undefined;
  return {
    id: idPath, sourcePath: idPath, kind: 'video', level, reason, status: itemStatus(level, plan),
    title: chosen?.displayName ?? parsed.chineseTitle ?? parsed.englishTitle ?? basename(idPath),
    year: chosen?.year ?? parsed.year, poster: chosen?.posterUrl,
    targetPath: plan?.tasks.find((t) => t.operation === 'create-dir')?.target,
    candidates: matches.map(tmdbCandidate), chosenId: chosen ? String(chosen.id) : null,
    plan, parsedVideo: parsed, videoMatches: matches, signature,
  };
}

/**
 * Analyze one leaf directory into one or more BatchItems. A single album, a TV
 * show, or a single movie yields one item. A directory holding several unrelated
 * movies (no episode pattern) yields one movie item *per file* — since true TV
 * episodes always live together in one folder, multiple non-series videos are
 * separate movies. A mixed audio+video folder is split per kind.
 */
export async function analyzeDir(
  dir: string,
  ctx: AnalyzeContext,
  signature: string,
): Promise<BatchItem[]> {
  const scan = await scanDirectory(dir);
  const items: BatchItem[] = [];

  if (scan.videoFiles.length === 0 && scan.audioFiles.length > 0) {
    return [await buildMusicItem(dir, ctx, signature)];
  }

  if (scan.videoFiles.length > 0) {
    const parsed = await parseMediaDir(dir);
    if (parsed.type === 'tv' || scan.videoFiles.length === 1) {
      // One show (episodes co-located) or one movie → a single item.
      items.push(await buildVideoItem(parsed, dir, ctx, signature, parsed.type === 'tv' ? 'tv' : 'movie'));
    } else {
      // Multiple non-series videos → one movie per file.
      for (const f of scan.videoFiles) {
        const pf = await parseMediaFile(f.path);
        items.push(await buildVideoItem(pf, f.path, ctx, signature, 'movie'));
      }
    }
    // Mixed folder: also surface the audio as one album (distinct id).
    if (scan.audioFiles.length > 0) {
      const m = await buildMusicItem(dir, ctx, signature);
      m.id = `${dir}#audio`;
      items.push(m);
    }
  }

  return items;
}
