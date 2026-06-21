export { findMediaItems } from './scan.js';
export { assessVideo, assessMusic } from './confidence.js';
export { analyzeDir, isAlreadyOrganized, type AnalyzeContext } from './analyze.js';
export {
  dirSignature,
  loadBatchCache,
  saveBatchCache,
  listBatchCaches,
  deleteBatchCache,
  clearBatchCaches,
  pruneBatchCaches,
  DEFAULT_BATCH_CACHE_MAX_AGE_DAYS,
  DEFAULT_BATCH_CACHE_MAX_ENTRIES,
} from './cache.js';
export type { BatchCacheInfo } from './cache.js';
export { DEFAULT_BATCH_OPTIONS } from './types.js';
export type {
  BatchKind,
  BatchStatus,
  ConfidenceLevel,
  Assessment,
  BatchCandidate,
  BatchItem,
  BatchOptions,
} from './types.js';
