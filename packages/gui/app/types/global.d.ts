import type { IPCApi } from '../../src/shared/ipc-types';

declare global {
  interface Window {
    metarrAPI: IPCApi;
  }
}
