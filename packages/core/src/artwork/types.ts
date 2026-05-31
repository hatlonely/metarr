export type ArtworkType = 'poster' | 'fanart' | 'season-poster' | 'episode-thumb';
export type NfoType = 'movie' | 'tvshow' | 'episode';

export interface ArtworkTask {
  kind: 'image';
  type: ArtworkType;
  downloadUrl: string;
  previewUrl: string;
  targetPath: string;
  description: string;
}

export interface NfoTask {
  kind: 'nfo';
  type: NfoType;
  content: string;
  targetPath: string;
  description: string;
}

export type MetadataTask = ArtworkTask | NfoTask;

export interface ArtworkPlan {
  tasks: MetadataTask[];
}

export interface ArtworkExecutionResult {
  succeeded: MetadataTask[];
  failed: { task: MetadataTask; error: Error }[];
}
