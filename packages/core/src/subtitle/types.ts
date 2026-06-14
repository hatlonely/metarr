export type SubtitleSource = 'subdl' | 'assrt';

/**
 * Canonical language key → display label, SubDL code, subtitle filename suffix.
 * SubDL uses uppercase codes both in the request `languages` param and in the
 * response `language` field (e.g. "EN", "ZH", "JA"). Traditional Chinese is "ZH_BG".
 */
export const LANGUAGE_CONFIG: Record<string, { display: string; subdlCode: string; suffix: string }> = {
  'zh':    { display: '简体中文', subdlCode: 'ZH',    suffix: 'zh' },
  'zh-TW': { display: '繁體中文', subdlCode: 'ZH_BG', suffix: 'zh-TW' },
  'en':    { display: 'English',  subdlCode: 'EN',    suffix: 'en' },
  'ja':    { display: '日本語',   subdlCode: 'JA',    suffix: 'ja' },
  'ko':    { display: '한국어',   subdlCode: 'KO',    suffix: 'ko' },
};

/** Reverse lookup: SubDL response language code (uppercase) → canonical language key */
export const SUBDL_CODE_TO_LANG: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CONFIG).map(([key, { subdlCode }]) => [subdlCode, key]),
);

/**
 * Tokens that commonly appear in subtitle filenames inside Assrt archives,
 * used to pick the right file by language (e.g. "...chs.srt", "...eng.srt").
 */
export const LANG_FILENAME_TOKENS: Record<string, string[]> = {
  'zh': ['chs', 'sc', 'gb', 'zh-cn', 'zh_cn', 'simplified', '简'],
  'zh-TW': ['cht', 'tc', 'big5', 'zh-tw', 'zh_tw', 'traditional', '繁'],
  'en': ['eng', 'en'],
  'ja': ['jpn', 'jp', 'ja'],
  'ko': ['kor', 'kr', 'ko'],
};

export const DEFAULT_SUBTITLE_LANGUAGES = ['zh', 'en'];

interface SubDLResolveInfo {
  kind: 'subdl';
  downloadUrl: string;
}

interface AssrtResolveInfo {
  kind: 'assrt';
  subId: number;
  token: string;
  /** Hints for picking the right file out of a (possibly season-pack) archive */
  season?: number;
  episode?: number;
  /** Canonical language key of the desired subtitle (zh / zh-TW / en / ...) */
  language: string;
}

export type ResolveInfo = SubDLResolveInfo | AssrtResolveInfo;

export interface SubtitleTask {
  source: SubtitleSource;
  language: string;
  languageDisplay: string;
  format: string;
  releaseName: string;
  downloadCount: number;
  resolveInfo: ResolveInfo;
  targetPath: string;
  description: string;
}

export interface SubtitlePlan {
  tasks: SubtitleTask[];
}

export interface SubtitleExecutionResult {
  succeeded: SubtitleTask[];
  failed: { task: SubtitleTask; error: Error }[];
}
