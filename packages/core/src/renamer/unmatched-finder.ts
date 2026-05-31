import { scanDirectory } from '../parser/scanner.js';
import { SUBTITLE_EXTENSIONS } from '../types/media.js';
import type { RenamePlan, UnmatchedFileInfo } from '../types/renamer.js';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

function classifyFile(extension: string): UnmatchedFileInfo['type'] {
  if (extension === '.nfo') return 'nfo';
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (SUBTITLE_EXTENSIONS.has(extension)) return 'subtitle';
  return 'other';
}

/**
 * Find files in the source directory that are not included in the rename plan.
 * In single-file mode (selectedFile is set), returns empty since other files are intentionally ignored.
 */
export async function findUnmatchedFiles(
  plan: RenamePlan,
  selectedFile?: string,
): Promise<UnmatchedFileInfo[]> {
  if (selectedFile) {
    return [];
  }

  const scanResult = await scanDirectory(plan.sourcePath);

  const plannedPaths = new Set<string>();
  for (const task of plan.tasks) {
    if (task.operation === 'rename') {
      plannedPaths.add(task.source);
    }
  }

  return scanResult.files
    .filter((file) => !plannedPaths.has(file.path))
    .map((file) => ({
      path: file.path,
      name: file.name,
      extension: file.extension,
      size: file.size,
      type: classifyFile(file.extension),
    }));
}
