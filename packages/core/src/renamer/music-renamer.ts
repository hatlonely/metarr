import { join, dirname } from 'node:path';
import type { ParsedAlbum } from '../types/media.js';
import type { RenamePlan, RenameTask } from '../types/renamer.js';
import type { MusicBrainzRelease } from '../musicbrainz/types.js';
import { resolveMusicNamingTemplate, renderTemplate, type MusicNamingTemplate } from './naming.js';

export interface MusicRenameOptions {
  /** Output library root; empty → organize next to the source folder. */
  destPath: string;
  namingPreset?: string;
  musicTemplate?: MusicNamingTemplate;
}

/** Strip characters illegal in a path segment. */
function sanitizeSegment(s: string): string {
  return s.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
}

/**
 * Generate a rename plan for an album. Uses the chosen MusicBrainz release when
 * provided (canonical titles/year/artist), otherwise the embedded-tag data in
 * `album` (pure local organize). Always produces a unified RenamePlan so the
 * executor / trash / history pipeline is reused unchanged.
 */
export function generateMusicRenamePlan(
  album: ParsedAlbum,
  release: MusicBrainzRelease | null,
  options: MusicRenameOptions,
): RenamePlan {
  const template = options.musicTemplate ?? resolveMusicNamingTemplate(options.namingPreset);

  const albumArtist = sanitizeSegment(release?.artist || album.albumArtist || 'Unknown Artist');
  const albumName = sanitizeSegment(release?.title || album.album || album.originalDirName);
  const year = release?.year ?? album.year;
  const multiDisc = (release?.discCount ?? album.discCount) > 1;
  const canonical = release?.tracks ?? [];

  const destPath = options.destPath?.trim() ? options.destPath : dirname(album.sourcePath);
  // Drop empty " ()" left when the year is unknown.
  const albumDirRel = renderTemplate(template.albumDir, { albumArtist, album: albumName, year })
    .replace(/\s*\(\)/g, '');
  const albumDir = join(destPath, albumDirRel);

  const tasks: RenameTask[] = [
    { operation: 'create-dir', source: '', target: albumDir, description: `创建目录 ${albumDirRel}` },
  ];

  // Process in a stable order (disc, track, filename) so sequential fallback
  // numbering and canonical matching are deterministic.
  const ordered = [...album.tracks].sort((a, b) => {
    if (a.disc !== b.disc) return a.disc - b.disc;
    const at = a.track ?? Number.MAX_SAFE_INTEGER;
    const bt = b.track ?? Number.MAX_SAFE_INTEGER;
    if (at !== bt) return at - bt;
    return a.originalFileName.localeCompare(b.originalFileName);
  });

  // Sequential fallback numbering per disc, used when a track number is missing.
  const discSeq = new Map<number, number>();

  for (const t of ordered) {
    const disc = t.disc;
    const seq = (discSeq.get(disc) ?? 0) + 1;
    discSeq.set(disc, seq);
    const trackNo = t.track ?? seq;

    // Title: prefer the canonical release track (matched by disc + position),
    // then the embedded-tag title, then a placeholder.
    let title = t.title ?? '';
    if (canonical.length) {
      const c = canonical.find((x) => x.disc === disc && x.position === trackNo);
      if (c?.title) title = c.title;
    }
    if (!title) title = `Track ${trackNo}`;

    const tmpl = multiDisc && template.multiDiscTrackFile ? template.multiDiscTrackFile : template.trackFile;
    const fileName = renderTemplate(tmpl, {
      disc,
      track: trackNo,
      title: sanitizeSegment(title),
      ext: t.extension,
    });

    tasks.push({
      operation: 'rename',
      source: join(album.sourcePath, t.relPath ?? t.originalFileName),
      target: join(albumDir, fileName),
      description: `${t.originalFileName} -> ${fileName}`,
    });
  }

  return {
    mediaType: 'music',
    mediaSummary: {
      name: release?.title || album.album || album.originalDirName,
      originalName: release?.artist || album.albumArtist,
      year,
      poster: release?.coverUrl,
      type: 'music',
    },
    sourcePath: album.sourcePath,
    destPath,
    tasks,
    summary: { name: albumName, mediaType: 'music', fileCount: album.tracks.length },
  };
}
