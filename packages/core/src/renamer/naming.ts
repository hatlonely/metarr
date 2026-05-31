export interface NamingTemplate {
  tvDir: string;
  seasonDir: string;
  episodeFile: string;
  movieDir: string;
  movieFile: string;
}

const jellyfinTemplate: NamingTemplate = {
  tvDir: '{name} ({year}) [tmdbid-{tmdbId}]',
  seasonDir: 'Season {season:02}',
  episodeFile: '{name} ({year}) S{season:02}E{episode:02}{ext}',
  movieDir: '{name} ({year}) {idTag}',
  movieFile: '{name} ({year}) {idTag}{ext}',
};

export const NAMING_PRESETS: Record<string, NamingTemplate> = {
  universal: {
    tvDir: '{name} ({year})',
    seasonDir: 'Season {season:02}',
    episodeFile: '{name} S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
  },
  jellyfin: jellyfinTemplate,
  emby: jellyfinTemplate,
  plex: {
    tvDir: '{name} ({year})',
    seasonDir: 'Season {season:02}',
    episodeFile: '{name} - S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
  },
  kodi: {
    tvDir: '{name}',
    seasonDir: 'Season {season}',
    episodeFile: '{name} S{season:02}E{episode:02}{ext}',
    movieDir: '{name} ({year})',
    movieFile: '{name} ({year}){ext}',
  },
};

export const DEFAULT_NAMING_PRESET = 'universal';

export function resolveNamingTemplate(preset?: string): NamingTemplate {
  return (preset ? NAMING_PRESETS[preset] : undefined) ?? NAMING_PRESETS[DEFAULT_NAMING_PRESET];
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
