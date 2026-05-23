"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ContentArea } from "./content-area";
import { SettingsSheet } from "./settings-sheet";
import { useWorkflow } from "@/src/renderer/hooks/use-workflow";
import { useConfig } from "@/src/renderer/hooks/use-config";
import type { StepId } from "@/src/renderer/types/workflow";
import type { AppConfig } from "@/src/renderer/hooks/use-config";
import { StepSelect } from "@/src/renderer/components/steps/step-select";
import { StepParse } from "@/src/renderer/components/steps/step-parse";
import { StepSearch } from "@/src/renderer/components/steps/step-search";
import { StepPreview } from "@/src/renderer/components/steps/step-preview";
import { StepExecute } from "@/src/renderer/components/steps/step-execute";

export function AppShell() {
  const {
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
    setConflictResolution,
    setAllConflictResolutions,
    toggleFileRemoval,
    setAllFilesToRemove,
    reset,
  } = useWorkflow();

  const { config, loaded, setConfig, showSettings } = useConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (showSettings) {
      setSettingsOpen(true);
    }
  }, [showSettings]);

  const locale = config.displayLanguage.startsWith("zh") ? "zh" : "en";

  const handleSaveConfig = (updates: Partial<AppConfig>) => {
    setConfig(updates);
  };

  const handleStepClick = (step: StepId) => {
    goToStep(step);
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case "select":
        return (
          <StepSelect
            locale={locale}
            loading={state.loading}
            mediaType={state.mediaType}
            onMediaTypeChange={setMediaType}
            onSelect={() => selectDirectory(config.tmdbKey)}
          />
        );
      case "parse":
        return state.parsed ? (
          <StepParse
            locale={locale}
            parsed={state.parsed}
            mediaType={state.mediaType}
            searchQuery={state.searchQuery}
            loading={state.loading}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => searchTmdb(config.tmdbKey, undefined, config.displayLanguage)}
            onMediaTypeChange={setMediaType}
          />
        ) : null;
      case "search":
        return (
          <StepSearch
            locale={locale}
            results={state.tmdbResults}
            selectedMatch={state.selectedMatch}
            searchQuery={state.searchQuery}
            loading={state.loading}
            defaultDestPath={config.destPath}
            onSelectMatch={(match) => selectMatch(match, config.tmdbKey)}
            onReSearch={() => searchTmdb(config.tmdbKey)}
            onGeneratePlan={(destPath) =>
              generatePlan(config.tmdbKey, destPath, config.preferImdbId)
            }
          />
        );
      case "preview":
        return state.plan ? (
          <StepPreview
            locale={locale}
            plan={state.plan}
            executing={state.executing}
            conflictResult={state.conflictResult}
            conflictResolutions={state.conflictResolutions}
            unmatchedFiles={state.unmatchedFiles}
            filesToRemove={state.filesToRemove}
            onBack={() => goToStep("search")}
            onExecute={() => executeRename()}
            onSetConflictResolution={setConflictResolution}
            onSetAllConflictResolutions={setAllConflictResolutions}
            onToggleFileRemoval={toggleFileRemoval}
            onSetAllFilesToRemove={setAllFilesToRemove}
          />
        ) : null;
      case "execute":
        return state.executionResult ? (
          <StepExecute locale={locale} result={state.executionResult} onContinue={reset} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={handleStepClick}
        onOpenSettings={() => setSettingsOpen(true)}
        locale={locale}
      />
      <ContentArea error={state.error} onDismissError={() => setError(null)}>
        {renderStep()}
      </ContentArea>
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onSave={handleSaveConfig}
        locale={locale}
      />
    </div>
  );
}
