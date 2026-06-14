'use client';

import { useState, useCallback } from 'react';
import { parseDirName, parseFileName } from '@/lib/parser-browser';
import type { ParsedEpisode } from '@/lib/parser-browser';
import { findDemoDataKey, getSearchResults, getRenamePlan } from '@/lib/demo-data';
import type { FakeSearchResult, FakeRenamePlan } from '@/lib/demo-data';

export type DemoStep = 1 | 2 | 3 | 4 | 5 | 6;

const MAX_STEP: DemoStep = 6;

interface ParsedDirResult {
  chineseTitle?: string;
  englishTitle?: string;
  year?: number;
  tags: Record<string, unknown>;
  isClean: boolean;
}

interface DemoState {
  step: DemoStep;
  inputDirName: string;
  inputFiles: string[];
  parsedDir: ParsedDirResult | null;
  parsedFiles: ParsedEpisode[];
  searchResults: FakeSearchResult[];
  selectedMatch: FakeSearchResult | null;
  renamePlan: FakeRenamePlan | null;
  demoDataKey: string;
  loading: boolean;
}

const initialState: DemoState = {
  step: 1,
  inputDirName: '',
  inputFiles: [],
  parsedDir: null,
  parsedFiles: [],
  searchResults: [],
  selectedMatch: null,
  renamePlan: null,
  demoDataKey: '',
  loading: false,
};

export function useDemoWorkflow() {
  const [state, setState] = useState<DemoState>(initialState);

  const setInput = useCallback((dirName: string, files: string[]) => {
    setState((prev) => ({ ...prev, inputDirName: dirName, inputFiles: files }));
  }, []);

  const parse = useCallback(() => {
    if (!state.inputDirName) return;

    const parsedDir = parseDirName(state.inputDirName);
    const parsedFiles = state.inputFiles.map((f) => parseFileName(f));

    const key = findDemoDataKey(parsedDir.chineseTitle, parsedDir.englishTitle);

    setState((prev) => ({
      ...prev,
      step: 2,
      parsedDir: parsedDir as ParsedDirResult,
      parsedFiles,
      demoDataKey: key,
    }));
  }, [state.inputDirName, state.inputFiles]);

  const search = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    // Simulate 500ms delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const results = getSearchResults(state.demoDataKey);

    setState((prev) => ({
      ...prev,
      step: 3,
      searchResults: results,
      loading: false,
    }));
  }, [state.demoDataKey]);

  const selectMatch = useCallback(
    (match: FakeSearchResult) => {
      const plan = getRenamePlan(state.demoDataKey);

      setState((prev) => ({
        ...prev,
        step: 4,
        selectedMatch: match,
        renamePlan: plan,
      }));
    },
    [state.demoDataKey],
  );

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.min(MAX_STEP, prev.step + 1) as DemoStep,
    }));
  }, []);

  const back = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as DemoStep,
    }));
  }, []);

  const goToStep = useCallback((step: DemoStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    setInput,
    parse,
    search,
    selectMatch,
    next,
    back,
    goToStep,
    reset,
  };
}
