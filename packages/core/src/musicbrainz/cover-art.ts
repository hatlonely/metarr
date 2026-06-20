/**
 * Resolve album cover art from commercial catalogs, which cover (Asian) pop far
 * better than the Cover Art Archive (which is sparse and often 404s). Tries
 * iTunes, then Deezer; both are free and need no API key. Returns a usable image
 * URL, or undefined when nothing is found (caller shows a placeholder).
 */
export async function fetchAlbumCover(
  artist?: string,
  album?: string,
): Promise<string | undefined> {
  const term = [artist, album].filter(Boolean).join(' ').trim();
  if (!term) return undefined;

  // iTunes Search API → 100x100 thumb, upscaled to 600x600.
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=1`,
    );
    if (res.ok) {
      const data = (await res.json()) as { results?: { artworkUrl100?: string }[] };
      const art = data.results?.[0]?.artworkUrl100;
      if (art) return art.replace('100x100', '600x600');
    }
  } catch {
    // fall through to Deezer
  }

  // Deezer → xl/big cover.
  try {
    const res = await fetch(
      `https://api.deezer.com/search/album?q=${encodeURIComponent(term)}&limit=1`,
    );
    if (res.ok) {
      const data = (await res.json()) as { data?: { cover_xl?: string; cover_big?: string }[] };
      const cover = data.data?.[0]?.cover_xl || data.data?.[0]?.cover_big;
      if (cover) return cover;
    }
  } catch {
    // give up — caller falls back to a placeholder
  }

  return undefined;
}
