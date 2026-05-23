import type { IPCApi } from '../../shared/ipc-types';

declare global {
  interface Window {
    metarrAPI: IPCApi;
  }
}
