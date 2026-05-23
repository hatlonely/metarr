"use client";

import { useReducer, useCallback } from "react";
import type {
  WorkflowState,
  WorkflowAction,
  StepId,
} from "@/src/renderer/types/workflow";
import type { ParsedMedia, TMDBMatch, RenamePlan, ExecutionResult } from "@metarr/core";
import { ipc } from "@/src/renderer/lib/ipc";

const steps: StepId[] = ["select", "parse", "search", "preview", "execute"];

const initialState: WorkflowState = {
  currentStep: "select",
  sourcePath: null,
  parsed: null,
  mediaType: "auto",
  searchQuery: "",
  tmdbResults: [],
  selectedMatch: null,
  plan: null,
  executionResult: null,
  executing: false,
  error: null,
  loading: false,
};

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step, error: null };
    case "SET_SOURCE_PATH":
      return { ...state, sourcePath: action.path };
    case "SET_PARSED":
      return { ...state, parsed: action.parsed };
    case "SET_MEDIA_TYPE":
      return { ...state, mediaType: action.mediaType };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };
    case "SET_TMDB_RESULTS":
      return { ...state, tmdbResults: action.results };
    case "SELECT_MATCH":
      return { ...state, selectedMatch: action.match };
    case "SET_PLAN":
      return { ...state, plan: action.plan };
    case "SET_EXECUTION_RESULT":
      return { ...state, executionResult: action.result };
    case "SET_EXECUTING":
      return { ...state, executing: action.executing };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "RESET":
      return {
        ...initialState,
        currentStep: "select",
      };
    default:
      return state;
  }
}

export function useWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const goToStep = useCallback((step: StepId) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", error });
  }, []);

  const setMediaType = useCallback((mediaType: "tv" | "movie" | "auto") => {
    dispatch({ type: "SET_MEDIA_TYPE", mediaType });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", query });
  }, []);

  const selectDirectory = useCallback(async (tmdbKey: string) => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const dirPath = await ipc.openDirectory();
      if (!dirPath) {
        dispatch({ type: "SET_LOADING", loading: false });
        return;
      }
      dispatch({ type: "SET_SOURCE_PATH", path: dirPath });

      const result = await ipc.parseDirectory(dirPath);
      dispatch({ type: "SET_PARSED", parsed: result });
      dispatch({
        type: "SET_SEARCH_QUERY",
        query: result.chineseTitle || result.englishTitle || "",
      });

      if (result.type === "tv" || result.type === "movie") {
        dispatch({ type: "SET_MEDIA_TYPE", mediaType: result.type });
      }

      dispatch({ type: "SET_STEP", step: "parse" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: `解析失败: ${(err as Error).message}` });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, []);

  const searchTmdb = useCallback(
    async (tmdbKey: string, query?: string, language?: string) => {
      if (!state.parsed || !tmdbKey) return;
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      try {
        const q = query || state.searchQuery;
        if (!q) {
          dispatch({ type: "SET_LOADING", loading: false });
          return;
        }
        const type =
          state.mediaType === "auto"
            ? (state.parsed.type === "movie" ? "movie" : "tv")
            : state.mediaType;

        const results = await ipc.tmdbSearch(
          tmdbKey,
          q,
          type,
          state.parsed.year,
          language,
        );
        dispatch({ type: "SET_TMDB_RESULTS", results });
        dispatch({ type: "SELECT_MATCH", match: null });
        dispatch({ type: "SET_STEP", step: "search" });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: `搜索失败: ${(err as Error).message}` });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state.parsed, state.searchQuery, state.mediaType],
  );

  const selectMatch = useCallback(
    async (match: TMDBMatch, tmdbKey: string) => {
      dispatch({ type: "SELECT_MATCH", match });
      if (match.type === "movie" && tmdbKey) {
        try {
          const details = await ipc.tmdbGetMovieDetails(tmdbKey, match.id);
          if (details.imdb_id) {
            dispatch({
              type: "SELECT_MATCH",
              match: { ...match, imdbId: details.imdb_id },
            });
          }
        } catch {
          // Ignore
        }
      }
    },
    [],
  );

  const generatePlan = useCallback(
    async (tmdbKey: string, destPath: string, preferImdbId: boolean) => {
      if (!state.parsed || !state.selectedMatch) return;
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });

      try {
        const newPlan = await ipc.generateRenamePlan(state.parsed, state.selectedMatch, {
          destPath,
          dryRun: false,
          preferImdbId,
        });
        dispatch({ type: "SET_PLAN", plan: newPlan });
        dispatch({ type: "SET_STEP", step: "preview" });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: `生成计划失败: ${(err as Error).message}` });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [state.parsed, state.selectedMatch],
  );

  const executeRename = useCallback(async () => {
    if (!state.plan) return;
    dispatch({ type: "SET_EXECUTING", executing: true });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      const result = await ipc.executeRename(state.plan);
      dispatch({ type: "SET_EXECUTION_RESULT", result });
      dispatch({ type: "SET_STEP", step: "execute" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: `执行失败: ${(err as Error).message}` });
    } finally {
      dispatch({ type: "SET_EXECUTING", executing: false });
    }
  }, [state.plan]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
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
    selectDirectory,
    searchTmdb,
    selectMatch,
    generatePlan,
    executeRename,
    reset,
  };
}
