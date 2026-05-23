import type { MediaTags } from '../types/media.js';

const RESOLUTION_PATTERNS: [RegExp, string][] = [
  [/\b(2160[pP]|4[kK])\b/, '2160p'],
  [/\b(1080[pP])\b/, '1080p'],
  [/\b(720[pP])\b/, '720p'],
  [/\b(480[pP])\b/, '480p'],
];

const CODEC_PATTERNS: [RegExp, string][] = [
  [/\b(H\.?265|HEVC|x265)\b/i, 'H.265'],
  [/\b(H\.?264|AVC|x264)\b/i, 'H.264'],
  [/\b(VP9)\b/i, 'VP9'],
  [/\b(AV1)\b/i, 'AV1'],
];

const AUDIO_PATTERNS: [RegExp, string][] = [
  [/\b(DDP?[\s.]?5[\s.]?1)\b/i, 'DDP5.1'],
  [/\b(DTS[\s.]?HD[\s.]?MA)\b/i, 'DTSHD-MA'],
  [/\b(DTS[\s.]?5[\s.]?1)\b/i, 'DTS5.1'],
  [/\b(DTS[\s.]?X)\b/i, 'DTS-X'],
  [/\b(TrueHD)\b/i, 'TrueHD'],
  [/\b(AAC)\b/i, 'AAC'],
  [/\b(FLAC)\b/i, 'FLAC'],
  [/\b(PCM)\b/i, 'PCM'],
];

const SOURCE_PATTERNS: [RegExp, string][] = [
  [/\bWEB-DL\b/i, 'WEB-DL'],
  [/\bWEBRip\b/i, 'WEBRip'],
  [/\bBluRay|Blu-ray|BDRip\b/i, 'BluRay'],
  [/\bHDTV\b/i, 'HDTV'],
  [/\bHDRip\b/i, 'HDRip'],
  [/\bDVDRip\b/i, 'DVDRip'],
  [/\bREMUX\b/i, 'REMUX'],
];

export function parseTags(text: string): MediaTags {
  const tags: MediaTags = {};

  for (const [pattern, value] of RESOLUTION_PATTERNS) {
    if (pattern.test(text)) {
      tags.resolution = value;
      break;
    }
  }

  for (const [pattern, value] of CODEC_PATTERNS) {
    if (pattern.test(text)) {
      tags.codec = value;
      break;
    }
  }

  for (const [pattern, value] of AUDIO_PATTERNS) {
    if (pattern.test(text)) {
      tags.audioCodec = value;
      break;
    }
  }

  for (const [pattern, value] of SOURCE_PATTERNS) {
    if (pattern.test(text)) {
      tags.source = value;
      break;
    }
  }

  tags.isHDR = /\bHDR(?:10)?(?:\b|Plus)/i.test(text) && !/\bDV\b/.test(text);
  tags.isDV = /\bDV\b/i.test(text) || /Dolby[\s.]?Vision/i.test(text);
  if (tags.isDV) {
    tags.isHDR = false;
  }

  tags.isHQ = /\bHQ\b/i.test(text) || /\b高码\b/.test(text);

  const groupMatch = text.match(/-([A-Za-z0-9]+)(?:\.[A-Za-z0-9]+)?\s*$/);
  if (groupMatch) {
    const group = groupMatch[1];
    if (
      !RESOLUTION_PATTERNS.some(([p]) => p.test(group)) &&
      !CODEC_PATTERNS.some(([p]) => p.test(group)) &&
      !AUDIO_PATTERNS.some(([p]) => p.test(group)) &&
      !SOURCE_PATTERNS.some(([p]) => p.test(group)) &&
      !/^\d{3,4}[pPiI]$/.test(group)
    ) {
      tags.releaseGroup = group;
    }
  }

  return tags;
}
