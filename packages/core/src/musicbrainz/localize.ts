import type { ParsedAlbum } from '../types/media.js';
import type { MusicBrainzRelease } from './types.js';

/** Target Chinese script for title normalization. */
export type TitleScript = 'zh-Hans' | 'zh-Hant';

/** Whether a string contains any Han (Chinese) characters. */
export function hasHan(s: string | undefined): boolean {
  return !!s && /\p{Script=Han}/u.test(s);
}

// Cache OpenCC converters (dictionary load is non-trivial); dynamic import keeps
// the CJS build working (opencc-js is ESM-friendly but heavy).
const converters = new Map<TitleScript, (s: string) => string>();

async function getConverter(target: TitleScript): Promise<(s: string) => string> {
  let conv = converters.get(target);
  if (!conv) {
    const OpenCC = (await import('opencc-js')) as unknown as {
      Converter: (opt: { from: string; to: string }) => (s: string) => string;
    };
    conv =
      target === 'zh-Hans'
        ? OpenCC.Converter({ from: 't', to: 'cn' })
        : OpenCC.Converter({ from: 'cn', to: 'tw' });
    converters.set(target, conv);
  }
  return conv;
}

/** Convert Chinese text to the target script (no-op for non-Chinese text). */
export async function convertText(text: string | undefined, target: TitleScript): Promise<string | undefined> {
  if (!text || !hasHan(text)) return text;
  const conv = await getConverter(target);
  return conv(text);
}

/** Return a copy of the release with title/artist/track titles in `target` script. */
export async function localizeRelease(
  release: MusicBrainzRelease,
  target: TitleScript,
): Promise<MusicBrainzRelease> {
  const conv = await getConverter(target);
  const c = (s: string) => (hasHan(s) ? conv(s) : s);
  return {
    ...release,
    title: c(release.title),
    artist: c(release.artist),
    tracks: release.tracks.map((t) => ({ ...t, title: c(t.title) })),
  };
}

/** Return a copy of the album (tag data) with text in `target` script. */
export async function localizeAlbum(album: ParsedAlbum, target: TitleScript): Promise<ParsedAlbum> {
  const conv = await getConverter(target);
  const c = (s?: string) => (s && hasHan(s) ? conv(s) : s);
  return {
    ...album,
    albumArtist: c(album.albumArtist),
    album: c(album.album),
    tracks: album.tracks.map((t) => ({ ...t, title: c(t.title), artist: c(t.artist) })),
  };
}
