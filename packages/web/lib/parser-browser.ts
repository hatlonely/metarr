// Browser-compatible parser: import directly from individual source files
// that have no Node.js dependencies (pure string/regex operations).
import { parseDirName } from '../../core/src/parser/dir-parser';
import { parseFileName } from '../../core/src/parser/file-parser';
import { parseTags } from '../../core/src/parser/tag-parser';
import type { ParsedEpisode, MediaTags } from '../../core/src/types/media';

export type { ParsedEpisode, MediaTags };
export { parseDirName, parseFileName, parseTags };
