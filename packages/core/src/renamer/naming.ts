export interface NamingTemplate {
  tvDir: string;
  seasonDir: string;
  episodeFile: string;
  movieDir: string;
  movieFile: string;
  /** Poster filename placed in movie/show directory and season directories */
  posterFile?: string;
  /** Fanart/backdrop filename placed in movie/show directory */
  fanartFile?: string;
  /** NFO filename placed in movie directory (TV show always uses tvshow.nfo) */
  nfoFile?: string;
}

const jellyfinTemplate: NamingTemplate = {
  tvDir: '{name} ({year}) [tmdbid-{tmdbId}]',
  seasonDir: 'Season {season:02}',
  episodeFile: '{name} ({year}) S{season:02}E{episode:02}{ext}',
  movieDir: '{name} ({year}) {idTag}',
  movieFile: '{name} ({year}) {idTag}{ext}',
  posterFile: 'poster.jpg',
  fanartFile: 'fanart.jpg',
  nfoFile: 'movie.nfo',
};

export const NAMING_PRESETS: Record<string, NamingTemplate> = {
  universal: {
    tvDir: '{name} ({year})',
    seasonDir: 'Season {season:02}',
    episodeFile: '{name} S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
    posterFile: 'poster.jpg',
    fanartFile: 'fanart.jpg',
    nfoFile: 'movie.nfo',
  },
  jellyfin: jellyfinTemplate,
  emby: jellyfinTemplate,
  plex: {
    tvDir: '{name} ({year})',
    seasonDir: 'Season {season:02}',
    episodeFile: '{name} - S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
    posterFile: 'poster.jpg',
    fanartFile: 'background.jpg',
    nfoFile: 'movie.nfo',
  },
  kodi: {
    tvDir: '{name}',
    seasonDir: 'Season {season}',
    episodeFile: '{name} S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
    posterFile: '{name}-poster.jpg',
    fanartFile: '{name}-fanart.jpg',
    nfoFile: '{name}.nfo',
  },
};

export const DEFAULT_NAMING_PRESET = 'universal';

export function resolveNamingTemplate(preset?: string): NamingTemplate {
  return (preset ? NAMING_PRESETS[preset] : undefined) ?? NAMING_PRESETS[DEFAULT_NAMING_PRESET];
}

/** Naming template for music: album directory + per-track file name. */
export interface MusicNamingTemplate {
  /** May contain '/' to nest artist/album, e.g. '{albumArtist}/{album} ({year})'. */
  albumDir: string;
  trackFile: string;
  /** Used instead of trackFile for multi-disc releases. */
  multiDiscTrackFile?: string;
}

export const MUSIC_NAMING_PRESETS: Record<string, MusicNamingTemplate> = {
  universal: {
    albumDir: '{albumArtist}/{album} ({year})',
    trackFile: '{track:02} - {title}{ext}',
    multiDiscTrackFile: '{disc}-{track:02} - {title}{ext}',
  },
};

export const DEFAULT_MUSIC_PRESET = 'universal';

export function resolveMusicNamingTemplate(preset?: string): MusicNamingTemplate {
  return (
    (preset ? MUSIC_NAMING_PRESETS[preset] : undefined) ?? MUSIC_NAMING_PRESETS[DEFAULT_MUSIC_PRESET]
  );
}

/**
 * Render a naming template string with the given variables.
 * Supports zero-padding: {season:02} pads season to 2 digits.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)(?::0(\d+))?\}/g, (_, key, pad) => {
    const val = vars[key as string];
    if (val === undefined || val === null) return '';
    const str = String(val);
    return pad ? str.padStart(Number(pad), '0') : str;
  });
}
