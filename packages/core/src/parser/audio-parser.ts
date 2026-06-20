import { basename, join } from 'node:path';
import type { ParsedAlbum, AudioTrack } from '../types/media.js';
import { scanDirectory, scanMediaDirectories } from './scanner.js';

/** Subset of music-metadata's common tags we consume. */
export interface TrackTags {
  albumartist?: string;
  artist?: string;
  album?: string;
  year?: number;
  title?: string;
  track?: { no?: number | null };
  disk?: { no?: number | null };
}

export interface TrackInput {
  name: string;
  extension: string;
  /** Path relative to the album root (defaults to name for flat albums). */
  relPath?: string;
  /** Disc number inferred from a "Disc N" / "CD N" subdirectory, if any. */
  discFromDir?: number;
  /** Embedded tags, or null when unreadable / untagged. */
  tags: TrackTags | null;
}

/** Parse a disc number from a subdirectory name like "Disc 01" / "CD2". */
export function parseDiscNo(dirName: string): number | undefined {
  const m = /(?:disc|disk|cd)\s*0*(\d+)/i.exec(dirName);
  return m ? Number(m[1]) : undefined;
}

/** Pull a leading track number + title from a filename like "01 - Title.flac". */
export function fallbackFromName(name: string): { track?: number; title?: string } {
  const base = name.replace(/\.[^.]+$/, '');
  const m = base.match(/^\s*(\d{1,3})\s*[-._.)\]]*\s*(.+)$/);
  if (m && m[2]) return { track: Number(m[1]), title: m[2].trim() };
  return { title: base.trim() };
}

function topKey(counts: Map<string, number>): string | undefined {
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Quality/format junk tokens that pollute album folder names. */
const ALBUM_JUNK =
  /\b(?:24 ?bit|16 ?bit|flac|wav|ape|dsd\d*|dff|dsf|web(?:[\s-]?dl|rip)?|hi-?res|mqa|tta|alac|aac|mp3|320 ?k(?:bps)?|\d?cd|verified|remaster(?:ed)?|无损|分轨)\b/gi;

/**
 * Best-effort album metadata from a messy directory name when embedded tags are
 * missing, e.g. "[191215] 周杰伦 - 我是如此相信 24bit" → { artist: 周杰伦,
 * album: 我是如此相信 }. Strips bracketed prefixes, quality/format junk and a
 * standalone year, then splits an "Artist - Album" pattern.
 */
export function parseAlbumDirName(dirName: string): {
  artist?: string;
  album?: string;
  year?: number;
} {
  // Pull a full date (YYYY.MM.DD / YYYY-MM-DD / YYYY MM DD): keep the year, drop
  // the month/day so they don't pollute the album (e.g. "1996.12.05 好想你").
  let raw = dirName;
  let year: number | undefined;
  const dm = raw.match(/((?:19|20)\d{2})[.\-/ ]\s*\d{1,2}[.\-/ ]\s*\d{1,2}(?!\d)/);
  if (dm) {
    year = Number(dm[1]);
    raw = raw.replace(dm[0], ' ');
  }

  // Treat CJK title marks as separators (e.g. "五月天《创造小巨蛋》" → artist/album).
  // Normalize underscores and *separator* dots (".-.", ". ", " .") to spaces, but
  // keep dots inside initials like "S.H.E" / "G.E.M.".
  let s = raw
    .replace(/[《「『]/g, ' - ')
    .replace(/[》」』]/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\.(?=[-\s])|(?<=[-\s])\./g, ' ');
  if (!year) {
    const ym = s.match(/(?:^|[^\d])((?:19|20)\d{2})(?:$|[^\d])/);
    year = ym ? Number(ym[1]) : undefined;
  }

  s = s.replace(/[[【][^\]】]*[\]】]/g, ' ').replace(/[{｛][^}｝]*[}｝]/g, ' '); // bracketed groups
  s = s.replace(/[(（][^)）]*[)）]/g, ' '); // parenthesized groups (quality / year)
  if (year) s = s.replace(new RegExp(`\\b${year}\\b`), ' ');
  s = s.replace(ALBUM_JUNK, ' ');
  // Collapse spaces; merge double separators left by a removed middle year
  // ("Artist - 2019 - Album" → "Artist - Album"); strip dangling end separators.
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/(?:\s*[-–—]\s*){2,}/g, ' - ');
  s = s.replace(/^[-–—]\s*|\s*[-–—]$/g, '').trim();

  // Split "Artist - Album", ignoring empty segments left by a stripped year.
  const parts = s.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { artist: parts[0] || undefined, album: parts.slice(1).join(' - ') || undefined, year };
  }
  return { album: parts[0] || s || undefined, year };
}

/** Drop a leading "Artist - " from a track title (single-file releases). */
function stripArtistPrefix(title: string, artist?: string): string {
  if (!artist) return title;
  const stripped = title.replace(new RegExp(`^${escapeRegExp(artist)}\\s*[-–—]\\s*`), '').trim();
  return stripped || title;
}

/** Strip a trailing disc marker from an album tag, e.g. "Album (Disc 1)" /
 *  "AlbumDisc2" / "Album CD1" → "Album" (per-disc rips often tag it this way). */
export function normalizeAlbumName(name: string): string {
  return name.replace(/\s*[([]?\s*(?:disc|disk|cd)\s*\d+\s*[)\]]?\s*$/i, '').trim() || name.trim();
}

/** Strip common junk that pollutes embedded tags: URLs, QQ/uploader ads, @group. */
export function cleanTagText(s: string | undefined): string | undefined {
  if (!s) return s;
  const cleaned = s
    .replace(/(?:https?:\/\/|www\.)\S+/gi, ' ')
    .replace(/可乐?\s*QQ\s*\d{5,}\s*制作?/g, ' ')
    .replace(/\bQQ\s*\d{5,}\b/gi, ' ')
    .replace(/[@＠]\s*[\w.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\s_]+$/, '')
    .trim();
  return cleaned || s.trim();
}

function mode(nums: number[]): number | undefined {
  if (nums.length === 0) return undefined;
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Aggregate per-file tags into an album model (pure — no I/O). Embedded tags
 * win; the filename fills in track number / title when tags are missing.
 */
export function aggregateAlbum(dirPath: string, items: TrackInput[]): ParsedAlbum {
  const albumArtists = new Map<string, number>();
  const albums = new Map<string, number>();
  const years: number[] = [];
  let discCount = 1;

  const tracks: AudioTrack[] = items.map((it) => {
    const t = it.tags;
    const fb = fallbackFromName(it.name);
    // The disc subdirectory is more authoritative than the disk tag, which is
    // frequently missing or wrongly set to 1 across all discs in these rips.
    const disc = it.discFromDir ?? t?.disk?.no ?? 1;
    discCount = Math.max(discCount, disc);
    const albumArtist = cleanTagText(t?.albumartist || t?.artist);
    if (albumArtist) albumArtists.set(albumArtist, (albumArtists.get(albumArtist) ?? 0) + 1);
    const cleanAlbum = cleanTagText(t?.album);
    if (cleanAlbum) {
      const a = normalizeAlbumName(cleanAlbum);
      if (a) albums.set(a, (albums.get(a) ?? 0) + 1);
    }
    if (t?.year) years.push(t.year);
    return {
      originalFileName: it.name,
      relPath: it.relPath ?? it.name,
      extension: it.extension,
      disc,
      track: t?.track?.no ?? fb.track,
      title: cleanTagText(t?.title) ?? fb.title,
      artist: cleanTagText(t?.artist),
    };
  });

  tracks.sort((a, b) => {
    if (a.disc !== b.disc) return a.disc - b.disc;
    const at = a.track ?? Number.MAX_SAFE_INTEGER;
    const bt = b.track ?? Number.MAX_SAFE_INTEGER;
    if (at !== bt) return at - bt;
    return a.originalFileName.localeCompare(b.originalFileName);
  });

  // Fall back to the directory name for fields the tags don't provide.
  const dn = parseAlbumDirName(basename(dirPath));
  const albumArtist = topKey(albumArtists) ?? dn.artist;
  const album = topKey(albums) ?? dn.album ?? basename(dirPath);
  const year = mode(years) ?? dn.year;

  // Drop a leading "Artist - " from titles (common in single-file releases).
  for (const t of tracks) if (t.title) t.title = stripArtistPrefix(t.title, albumArtist);

  return {
    albumArtist,
    album,
    year,
    discCount,
    tracks,
    originalDirName: basename(dirPath),
    sourcePath: dirPath,
  };
}

/** An album is "complete" enough to organize locally without MusicBrainz. */
export function isAlbumComplete(album: ParsedAlbum): boolean {
  return (
    !!album.albumArtist &&
    !!album.album &&
    album.tracks.length > 0 &&
    album.tracks.every((t) => !!t.title && t.track !== undefined)
  );
}

/** Read embedded tags for one file (dynamic import keeps the CJS build valid). */
async function readTags(path: string): Promise<TrackTags | null> {
  try {
    const mm = await import('music-metadata');
    const { common } = await mm.parseFile(path, { duration: false });
    return common as TrackTags;
  } catch {
    return null;
  }
}

interface CollectedFile {
  name: string;
  extension: string;
  path: string;
  relPath: string;
  discFromDir?: number;
}

/**
 * Gather an album's audio files: top-level when present, otherwise one level
 * deep into "Disc N" / "CD N" subdirectories (multi-disc layout).
 */
async function collectAudioFiles(dirPath: string): Promise<CollectedFile[]> {
  const scan = await scanDirectory(dirPath);
  if (scan.audioFiles.length > 0) {
    return scan.audioFiles.map((f) => ({
      name: f.name,
      extension: f.extension,
      path: f.path,
      relPath: f.name,
    }));
  }

  const out: CollectedFile[] = [];
  const subdirs = (await scanMediaDirectories(dirPath)).sort();
  let seq = 0;
  for (const sub of subdirs) {
    const subScan = await scanDirectory(sub);
    if (subScan.audioFiles.length === 0) continue;
    seq++;
    const discNo = parseDiscNo(basename(sub)) ?? seq;
    for (const f of subScan.audioFiles) {
      out.push({
        name: f.name,
        extension: f.extension,
        path: f.path,
        relPath: join(basename(sub), f.name),
        discFromDir: discNo,
      });
    }
  }
  return out;
}

/** Scan a directory of audio files (flat or multi-disc) and aggregate them. */
export async function parseAlbumDir(dirPath: string): Promise<ParsedAlbum> {
  const collected = await collectAudioFiles(dirPath);
  const items: TrackInput[] = [];
  for (const f of collected) {
    items.push({
      name: f.name,
      extension: f.extension,
      relPath: f.relPath,
      discFromDir: f.discFromDir,
      tags: await readTags(f.path),
    });
  }
  return aggregateAlbum(dirPath, items);
}
