import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  AUDIO_EXTENSIONS,
  type ParsedEpisode,
} from '../types/media.js';
import { parseFileName, parseSubtitleFile } from './file-parser.js';

export interface FileInfo {
  name: string;
  path: string;
  extension: string;
  size: number;
  isVideo: boolean;
  isSubtitle: boolean;
  isAudio: boolean;
}

export interface ScanResult {
  files: FileInfo[];
  videoFiles: FileInfo[];
  subtitleFiles: FileInfo[];
  audioFiles: FileInfo[];
  episodes: ParsedEpisode[];
}

export async function scanDirectory(dirPath: string): Promise<ScanResult> {
  const entries = await readdir(dirPath);
  const files: FileInfo[] = [];
  const videoFiles: FileInfo[] = [];
  const subtitleFiles: FileInfo[] = [];
  const audioFiles: FileInfo[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const s = await stat(fullPath);
    if (!s.isFile()) continue;

    const ext = getExt(entry);
    const isVideo = VIDEO_EXTENSIONS.has(ext);
    const isSubtitle = SUBTITLE_EXTENSIONS.has(ext);
    const isAudio = AUDIO_EXTENSIONS.has(ext);

    const info: FileInfo = {
      name: entry,
      path: fullPath,
      extension: ext,
      size: s.size,
      isVideo,
      isSubtitle,
      isAudio,
    };

    files.push(info);
    if (isVideo) videoFiles.push(info);
    if (isSubtitle) subtitleFiles.push(info);
    if (isAudio) audioFiles.push(info);
  }

  // Parse each video file into an episode
  const videoNames = videoFiles.map((f) => f.name);
  const episodes: ParsedEpisode[] = videoFiles.map((vf) => {
    const episode = parseFileName(vf.name);
    // Find associated subtitle files
    const associated: string[] = [];
    for (const sf of subtitleFiles) {
      const result = parseSubtitleFile(sf.name, videoNames);
      if (result.isAssociated && result.videoBaseName) {
        const videoBase = vf.name.replace(/\.[^.]+$/, '');
        if (result.videoBaseName === videoBase) {
          associated.push(sf.name);
        }
      }
    }
    episode.associatedFiles = associated;
    return episode;
  });

  return { files, videoFiles, subtitleFiles, audioFiles, episodes };
}

export async function scanMediaDirectories(parentPath: string): Promise<string[]> {
  const entries = await readdir(parentPath);
  const dirs: string[] = [];

  for (const entry of entries) {
    const fullPath = join(parentPath, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      dirs.push(fullPath);
    }
  }

  return dirs;
}

function getExt(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}
