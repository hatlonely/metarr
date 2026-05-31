export type ArtworkType = 'poster' | 'fanart' | 'season-poster';

export interface ArtworkTask {
  type: ArtworkType;
  /** High-resolution URL for downloading to disk */
  downloadUrl: string;
  /** w500 URL for UI thumbnail preview */
  previewUrl: string;
  targetPath: string;
  description: string;
}

export interface ArtworkPlan {
  tasks: ArtworkTask[];
}

export interface ArtworkExecutionResult {
  succeeded: ArtworkTask[];
  failed: { task: ArtworkTask; error: Error }[];
}
