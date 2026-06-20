'use client';

import { useReducer, useCallback } from 'react';
import type { WorkflowState, WorkflowAction, StepId } from '@/src/renderer/types/workflow';
import type {
  TMDBMatch,
  RenamePlan,
  ConflictResolution,
  NamingTemplate,
  MusicBrainzRelease,
  ArtworkTask,
} from '@metarr/core';
import type { OpenMediaResult } from '@/src/shared/ipc-types';
import { ipc } from '@/src/renderer/lib/ipc';

const steps: StepId[] = ['select', 'parse', 'search', 'preview', 'execute'];

const initialState: WorkflowState = {
  currentStep: 'select',
  kind: 'video',
  sourcePath: null,
  parsed: null,
  mediaType: 'auto',
  album: null,
  releases: [],
  selectedRelease: null,
  selectedReleaseId: null,
  searchQuery: '',
  tmdbResults: [],
  selectedMatch: null,
  plan: null,
  executionResult: null,
  conflictResult: null,
  conflictResolutions: {},
  unmatchedFiles: [],
  filesToRemove: [],
  artworkPlan: null,
  artworkLoading: false,
  selectedArtworkPaths: [],
  artworkResult: null,
  subtitlePlan: null,
  subtitleLoading: false,
  selectedSubtitlePaths: [],
  subtitleResult: null,
  executing: false,
  error: null,
  loading: false,
};

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step, error: null };
    case 'SET_SOURCE_PATH':
      return { ...state, sourcePath: action.path };
    case 'SET_PARSED':
      return { ...state, parsed: action.parsed };
    case 'SET_MEDIA_TYPE':
      return { ...state, mediaType: action.mediaType };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_TMDB_RESULTS':
      return { ...state, tmdbResults: action.results };
    case 'SELECT_MATCH':
      return { ...state, selectedMatch: action.match };
    case 'SET_PLAN':
      return { ...state, plan: action.plan };
    case 'SET_EXECUTION_RESULT':
      return { ...state, executionResult: action.result };
    case 'SET_CONFLICT_RESULT':
      return { ...state, conflictResult: action.result };
    case 'SET_CONFLICT_RESOLUTIONS':
      return { ...state, conflictResolutions: action.resolutions };
    case 'SET_UNMATCHED_FILES':
      return { ...state, unmatchedFiles: action.files };
    case 'SET_FILES_TO_REMOVE':
      return { ...state, filesToRemove: action.paths };
    case 'SET_ARTWORK_PLAN':
      return { ...state, artworkPlan: action.plan };
    case 'SET_ARTWORK_LOADING':
      return { ...state, artworkLoading: action.loading };
    case 'SET_SELECTED_ARTWORK':
      return { ...state, selectedArtworkPaths: action.paths };
    case 'SET_ARTWORK_RESULT':
      return { ...state, artworkResult: action.result };
    case 'SET_SUBTITLE_PLAN':
      return { ...state, subtitlePlan: action.plan };
    case 'SET_SUBTITLE_LOADING':
      return { ...state, subtitleLoading: action.loading };
    case 'SET_SELECTED_SUBTITLES':
      return { ...state, selectedSubtitlePaths: action.paths };
    case 'SET_SUBTITLE_RESULT':
      return { ...state, subtitleResult: action.result };
    case 'SET_EXECUTING':
      return { ...state, executing: action.executing };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_KIND':
      return { ...state, kind: action.kind };
    case 'SET_ALBUM':
      return { ...state, album: action.album };
    case 'SET_RELEASES':
      return { ...state, releases: action.releases };
    case 'SELECT_RELEASE':
      return { ...state, selectedRelease: action.release };
    case 'SET_SELECTED_RELEASE_ID':
      return { ...state, selectedReleaseId: action.id };
    case 'RESET':
      return { ...initialState, currentStep: 'select' };
    default:
      return state;
  }
}

export function useWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const goToStep = useCallback((step: StepId) => {
    dispatch({ type: 'SET_STEP', step });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const setMediaType = useCallback((mediaType: 'tv' | 'movie' | 'auto') => {
    dispatch({ type: 'SET_MEDIA_TYPE', mediaType });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, []);

  const handleMediaResult = useCallback(async (result: OpenMediaResult) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      dispatch({ type: 'SET_SOURCE_PATH', path: result.sourcePath });

      // Auto-route: an audio-dominant directory goes to the music flow.
      const kind = result.type === 'dir' ? await ipc.detectMediaKind(result.path) : 'video';
      dispatch({ type: 'SET_KIND', kind });

      if (kind === 'music') {
        const album = await ipc.parseAlbum(result.path);
        dispatch({ type: 'SET_ALBUM', album });
        dispatch({ type: 'SET_STEP', step: 'parse' });
        return;
      }

      const parsed =
        result.type === 'file'
          ? await ipc.parseFile(result.path)
          : await ipc.parseDirectory(result.path);

      dispatch({ type: 'SET_PARSED', parsed });
      dispatch({ type: 'SET_SEARCH_QUERY', query: parsed.chineseTitle || parsed.englishTitle || '' });

      if (parsed.type === 'tv' || parsed.type === 'movie') {
        dispatch({ type: 'SET_MEDIA_TYPE', mediaType: parsed.type });
      }

      dispatch({ type: 'SET_STEP', step: 'parse' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `解析失败: ${(err as Error).message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const selectMedia = useCallback(
    async (tmdbKey: string) => {
      const result = await ipc.openMedia();
      if (!result) return;
      await handleMediaResult(result);
    },
    [handleMediaResult],
  );

  const dropMedia = useCallback(
    async (filePath: string) => {
      const result = await ipc.resolveMediaPath(filePath);
      if (!result) return;
      await handleMediaResult(result);
    },
    [handleMediaResult],
  );

  const searchTmdb = useCallback(
    async (tmdbKey: string, query?: string, language?: string) => {
      if (!state.parsed || !tmdbKey) return;
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const q = query || state.searchQuery;
        const hasCandidates = (state.parsed.titleCandidates?.length ?? 0) > 0;
        const hasIds = !!(state.parsed.ids?.tmdb || state.parsed.ids?.imdb);
        if (!q && !hasCandidates && !hasIds) {
          dispatch({ type: 'SET_LOADING', loading: false });
          return;
        }

        // Multi-candidate locate: extracted candidates + IDs + the (possibly
        // edited) manual query, ranked by relevance.
        const results = await ipc.tmdbLocate(tmdbKey, state.parsed, {
          type: state.mediaType === 'auto' ? undefined : state.mediaType,
          language,
          manualQuery: q || undefined,
        });
        dispatch({ type: 'SET_TMDB_RESULTS', results });
        dispatch({ type: 'SELECT_MATCH', match: null });
        dispatch({ type: 'SET_STEP', step: 'search' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: `搜索失败: ${(err as Error).message}` });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.parsed, state.searchQuery, state.mediaType],
  );

  const selectMatch = useCallback(async (match: TMDBMatch, tmdbKey: string) => {
    dispatch({ type: 'SELECT_MATCH', match });
    if (match.type === 'movie' && tmdbKey) {
      try {
        const details = await ipc.tmdbGetMovieDetails(tmdbKey, match.id);
        if (details.imdb_id) {
          dispatch({ type: 'SELECT_MATCH', match: { ...match, imdbId: details.imdb_id } });
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const loadSubtitles = useCallback(
    async (
      match: TMDBMatch,
      plan: RenamePlan,
      options: { subdlApiKey?: string; assrtToken?: string; languages: string[] },
    ) => {
      if (!options.subdlApiKey && !options.assrtToken) return;
      dispatch({ type: 'SET_SUBTITLE_LOADING', loading: true });
      dispatch({ type: 'SET_SUBTITLE_PLAN', plan: null });
      dispatch({ type: 'SET_SELECTED_SUBTITLES', paths: [] });
      try {
        const subtitlePlan = await ipc.generateSubtitlePlan(match, plan, options);
        dispatch({ type: 'SET_SUBTITLE_PLAN', plan: subtitlePlan });
        dispatch({ type: 'SET_SELECTED_SUBTITLES', paths: subtitlePlan.tasks.map((t) => t.targetPath) });
      } catch {
        dispatch({ type: 'SET_SUBTITLE_PLAN', plan: { tasks: [] } });
      } finally {
        dispatch({ type: 'SET_SUBTITLE_LOADING', loading: false });
      }
    },
    [],
  );

  const loadArtwork = useCallback(
    async (
      tmdbKey: string,
      match: TMDBMatch,
      options: Parameters<typeof ipc.generateArtworkPlan>[2],
      plan: RenamePlan,
    ) => {
      dispatch({ type: 'SET_ARTWORK_LOADING', loading: true });
      dispatch({ type: 'SET_ARTWORK_PLAN', plan: null });
      dispatch({ type: 'SET_SELECTED_ARTWORK', paths: [] });
      try {
        const artworkPlan = await ipc.generateArtworkPlan(tmdbKey, match, options, plan);
        dispatch({ type: 'SET_ARTWORK_PLAN', plan: artworkPlan });
        dispatch({ type: 'SET_SELECTED_ARTWORK', paths: artworkPlan.tasks.map((t) => t.targetPath) });
      } catch {
        dispatch({ type: 'SET_ARTWORK_PLAN', plan: { tasks: [] } });
      } finally {
        dispatch({ type: 'SET_ARTWORK_LOADING', loading: false });
      }
    },
    [],
  );

  const generatePlan = useCallback(
    async (
      tmdbKey: string,
      destPath: string,
      preferImdbId: boolean,
      namingPreset: string,
      customTemplate?: NamingTemplate,
      subtitleOptions?: { subdlApiKey?: string; assrtToken?: string; languages: string[] },
    ) => {
      if (!state.parsed || !state.selectedMatch) return;
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });

      try {
        const renameOptions = {
          destPath,
          preferImdbId,
          namingPreset: namingPreset === 'custom' ? undefined : namingPreset,
          namingTemplate: namingPreset === 'custom' ? customTemplate : undefined,
        };

        const newPlan = await ipc.generateRenamePlan(state.parsed, state.selectedMatch, renameOptions);
        dispatch({ type: 'SET_PLAN', plan: newPlan });

        const conflictResult = await ipc.checkConflicts(newPlan);
        dispatch({ type: 'SET_CONFLICT_RESULT', result: conflictResult });

        if (conflictResult.hasConflicts) {
          const defaultResolutions: Record<number, ConflictResolution> = {};
          for (const conflict of conflictResult.conflicts) {
            defaultResolutions[conflict.taskIndex] = 'skip';
          }
          dispatch({ type: 'SET_CONFLICT_RESOLUTIONS', resolutions: defaultResolutions });
        }

        const unmatchedFiles = await ipc.findUnmatchedFiles(newPlan, state.parsed.selectedFile);
        dispatch({ type: 'SET_UNMATCHED_FILES', files: unmatchedFiles });
        dispatch({ type: 'SET_FILES_TO_REMOVE', paths: [] });

        dispatch({ type: 'SET_STEP', step: 'preview' });

        // Load artwork + subtitles in background (non-blocking)
        if (tmdbKey) {
          loadArtwork(tmdbKey, state.selectedMatch, renameOptions, newPlan);
        }
        if (subtitleOptions) {
          loadSubtitles(state.selectedMatch, newPlan, subtitleOptions);
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: `生成计划失败: ${(err as Error).message}` });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.parsed, state.selectedMatch, loadArtwork],
  );

  // --- Music flow ---

  const musicSearch = useCallback(async () => {
    if (!state.album) return;
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const releases = await ipc.musicLocate(state.album);
      dispatch({ type: 'SET_RELEASES', releases });
      dispatch({ type: 'SELECT_RELEASE', release: null });
      dispatch({ type: 'SET_SELECTED_RELEASE_ID', id: null }); // step-search default-selects top
      dispatch({ type: 'SET_STEP', step: 'search' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `搜索失败: ${(err as Error).message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, [state.album]);

  // Build the music plan from local tags (release = null) or a chosen release.
  const musicGeneratePlan = useCallback(
    async (release: MusicBrainzRelease | null) => {
      if (!state.album) return;
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'SET_ERROR', error: null });
      try {
        // Search results are summaries; fetch the full track list when chosen.
        const full =
          release && release.tracks.length === 0
            ? await ipc.musicGetRelease(release.mbid)
            : release;
        dispatch({ type: 'SELECT_RELEASE', release: full });

        const newPlan = await ipc.musicGeneratePlan(state.album, full);
        dispatch({ type: 'SET_PLAN', plan: newPlan });

        // Save the cover into the album folder (cover.jpg) so media servers like
        // Jellyfin can show it — reuses the artwork download/execute pipeline.
        const albumDir = newPlan.tasks.find((t) => t.operation === 'create-dir')?.target;
        if (full?.coverUrl && albumDir) {
          const coverPath = `${albumDir}/cover.jpg`;
          const coverTask: ArtworkTask = {
            kind: 'image',
            type: 'poster',
            downloadUrl: full.coverUrl,
            previewUrl: full.coverUrl,
            targetPath: coverPath,
            description: 'cover.jpg',
          };
          dispatch({ type: 'SET_ARTWORK_PLAN', plan: { tasks: [coverTask] } });
          dispatch({ type: 'SET_SELECTED_ARTWORK', paths: [coverPath] });
        } else {
          dispatch({ type: 'SET_ARTWORK_PLAN', plan: null });
          dispatch({ type: 'SET_SELECTED_ARTWORK', paths: [] });
        }

        const conflictResult = await ipc.checkConflicts(newPlan);
        dispatch({ type: 'SET_CONFLICT_RESULT', result: conflictResult });
        if (conflictResult.hasConflicts) {
          const defaults: Record<number, ConflictResolution> = {};
          for (const c of conflictResult.conflicts) defaults[c.taskIndex] = 'skip';
          dispatch({ type: 'SET_CONFLICT_RESOLUTIONS', resolutions: defaults });
        }
        const unmatchedFiles = await ipc.findUnmatchedFiles(newPlan);
        dispatch({ type: 'SET_UNMATCHED_FILES', files: unmatchedFiles });
        dispatch({ type: 'SET_FILES_TO_REMOVE', paths: [] });

        dispatch({ type: 'SET_STEP', step: 'preview' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: `生成计划失败: ${(err as Error).message}` });
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    },
    [state.album],
  );

  const musicSelect = useCallback((id: string | number) => {
    dispatch({ type: 'SET_SELECTED_RELEASE_ID', id: String(id) });
  }, []);

  // Confirm the search selection → build the plan (local tags or chosen release).
  const MUSIC_LOCAL_ID = '__local__';
  const musicConfirm = useCallback(() => {
    const id = state.selectedReleaseId;
    const release = id && id !== MUSIC_LOCAL_ID ? state.releases.find((r) => r.mbid === id) : null;
    musicGeneratePlan(release ?? null);
  }, [state.selectedReleaseId, state.releases, musicGeneratePlan]);

  const toggleSubtitleTask = useCallback(
    (targetPath: string) => {
      const current = new Set(state.selectedSubtitlePaths);
      if (current.has(targetPath)) { current.delete(targetPath); } else { current.add(targetPath); }
      dispatch({ type: 'SET_SELECTED_SUBTITLES', paths: Array.from(current) });
    },
    [state.selectedSubtitlePaths],
  );

  const setAllSubtitlesSelected = useCallback(
    (select: boolean) => {
      dispatch({
        type: 'SET_SELECTED_SUBTITLES',
        paths: select ? (state.subtitlePlan?.tasks ?? []).map((t) => t.targetPath) : [],
      });
    },
    [state.subtitlePlan],
  );

  const toggleArtworkTask = useCallback(
    (targetPath: string) => {
      const current = new Set(state.selectedArtworkPaths);
      if (current.has(targetPath)) {
        current.delete(targetPath);
      } else {
        current.add(targetPath);
      }
      dispatch({ type: 'SET_SELECTED_ARTWORK', paths: Array.from(current) });
    },
    [state.selectedArtworkPaths],
  );

  const setAllArtworkSelected = useCallback(
    (select: boolean) => {
      if (!state.artworkPlan) return;
      dispatch({
        type: 'SET_SELECTED_ARTWORK',
        paths: select ? state.artworkPlan.tasks.map((t) => t.targetPath) : [],
      });
    },
    [state.artworkPlan],
  );

  const executeRename = useCallback(async () => {
    if (!state.plan) return;
    dispatch({ type: 'SET_EXECUTING', executing: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const result = await ipc.executeRename(
        state.plan,
        state.conflictResolutions,
        state.filesToRemove.length > 0 ? state.filesToRemove : undefined,
      );
      dispatch({ type: 'SET_EXECUTION_RESULT', result });

      // Execute selected artwork downloads
      let artworkResult = null;
      const selectedArtworkTasks = (state.artworkPlan?.tasks ?? []).filter((t) =>
        state.selectedArtworkPaths.includes(t.targetPath),
      );
      if (selectedArtworkTasks.length > 0) {
        artworkResult = await ipc.executeArtworkPlan(selectedArtworkTasks);
        dispatch({ type: 'SET_ARTWORK_RESULT', result: artworkResult });
      }

      // Execute selected subtitle downloads
      let subtitleResult = null;
      const selectedSubtitleTasks = (state.subtitlePlan?.tasks ?? []).filter((t) =>
        state.selectedSubtitlePaths.includes(t.targetPath),
      );
      if (selectedSubtitleTasks.length > 0) {
        subtitleResult = await ipc.executeSubtitlePlan(selectedSubtitleTasks);
        dispatch({ type: 'SET_SUBTITLE_RESULT', result: subtitleResult });
      }

      // Record this run so it can be reviewed and undone from the history panel.
      try {
        await ipc.historyRecord(state.plan, result, artworkResult, subtitleResult);
      } catch {
        // History is best-effort; never block the workflow on it.
      }

      dispatch({ type: 'SET_STEP', step: 'execute' });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `执行失败: ${(err as Error).message}` });
    } finally {
      dispatch({ type: 'SET_EXECUTING', executing: false });
    }
  }, [
    state.plan,
    state.conflictResolutions,
    state.filesToRemove,
    state.artworkPlan,
    state.selectedArtworkPaths,
    state.subtitlePlan,
    state.selectedSubtitlePaths,
  ]);

  const setConflictResolution = useCallback(
    (taskIndex: number, resolution: ConflictResolution) => {
      dispatch({
        type: 'SET_CONFLICT_RESOLUTIONS',
        resolutions: { ...state.conflictResolutions, [taskIndex]: resolution },
      });
    },
    [state.conflictResolutions],
  );

  const setAllConflictResolutions = useCallback(
    (resolution: ConflictResolution) => {
      if (!state.conflictResult) return;
      const resolutions: Record<number, ConflictResolution> = {};
      for (const conflict of state.conflictResult.conflicts) {
        resolutions[conflict.taskIndex] = resolution;
      }
      dispatch({ type: 'SET_CONFLICT_RESOLUTIONS', resolutions });
    },
    [state.conflictResult],
  );

  const toggleFileRemoval = useCallback(
    (filePath: string) => {
      const current = new Set(state.filesToRemove);
      if (current.has(filePath)) { current.delete(filePath); } else { current.add(filePath); }
      dispatch({ type: 'SET_FILES_TO_REMOVE', paths: Array.from(current) });
    },
    [state.filesToRemove],
  );

  const setAllFilesToRemove = useCallback(
    (remove: boolean) => {
      dispatch({
        type: 'SET_FILES_TO_REMOVE',
        paths: remove ? state.unmatchedFiles.map((f) => f.path) : [],
      });
    },
    [state.unmatchedFiles],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const currentStepIndex = steps.indexOf(state.currentStep);

  return {
    state,
    steps,
    currentStepIndex,
    goToStep,
    setError,
    setMediaType,
    setSearchQuery,
    selectMedia,
    dropMedia,
    searchTmdb,
    selectMatch,
    generatePlan,
    executeRename,
    toggleArtworkTask,
    setAllArtworkSelected,
    toggleSubtitleTask,
    setAllSubtitlesSelected,
    setConflictResolution,
    setAllConflictResolutions,
    toggleFileRemoval,
    setAllFilesToRemove,
    musicSearch,
    musicSelect,
    musicConfirm,
    reset,
  };
}
