'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { ContentArea } from './content-area';
import { SettingsSheet } from './settings-sheet';
import { useWorkflow } from '@/src/renderer/hooks/use-workflow';
import { useConfig } from '@/src/renderer/hooks/use-config';
import type { StepId } from '@/src/renderer/types/workflow';
import type { AppConfig } from '@/src/renderer/hooks/use-config';
import { StepSelect } from '@/src/renderer/components/steps/step-select';
import { StepParse } from '@/src/renderer/components/steps/step-parse';
import { StepSearch } from '@/src/renderer/components/steps/step-search';
import { StepPreview } from '@/src/renderer/components/steps/step-preview';
import { StepExecute } from '@/src/renderer/components/steps/step-execute';
import { Reveal } from '@/src/renderer/components/ui/reveal';

export function AppShell() {
  const {
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
    reset,
  } = useWorkflow();

  const { config, loaded, setConfig, showSettings } = useConfig();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (showSettings) {
      setSettingsOpen(true);
    }
  }, [showSettings]);

  const locale = config.displayLanguage.startsWith('zh') ? 'zh' : 'en';

  const handleSaveConfig = (updates: Partial<AppConfig>) => {
    setConfig(updates);
  };

  const handleStepClick = (step: StepId) => {
    goToStep(step);
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'select':
        return (
          <StepSelect
            locale={locale}
            step={currentStepIndex + 1}
            loading={state.loading}
            mediaType={state.mediaType}
            onMediaTypeChange={setMediaType}
            onSelect={() => selectMedia(config.tmdbKey)}
            onDrop={(filePath) => dropMedia(filePath)}
          />
        );
      case 'parse':
        return state.parsed ? (
          <StepParse
            locale={locale}
            step={currentStepIndex + 1}
            parsed={state.parsed}
            mediaType={state.mediaType}
            searchQuery={state.searchQuery}
            loading={state.loading}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => searchTmdb(config.tmdbKey, undefined, config.displayLanguage)}
            onMediaTypeChange={setMediaType}
          />
        ) : null;
      case 'search':
        return (
          <StepSearch
            locale={locale}
            step={currentStepIndex + 1}
            results={state.tmdbResults}
            selectedMatch={state.selectedMatch}
            searchQuery={state.searchQuery}
            loading={state.loading}
            onSelectMatch={(match) => selectMatch(match, config.tmdbKey)}
            onReSearch={() => searchTmdb(config.tmdbKey)}
            onGeneratePlan={() =>
              generatePlan(
                config.tmdbKey,
                config.destPath,
                config.preferImdbId,
                config.namingPreset,
                config.namingPreset === 'custom' ? config.customNamingTemplate : undefined,
                {
                  subdlApiKey: config.subdlApiKey || undefined,
                  assrtToken: config.assrtToken || undefined,
                  languages: config.subtitleLanguages,
                },
              )
            }
          />
        );
      case 'preview':
        return state.plan ? (
          <StepPreview
            locale={locale}
            step={currentStepIndex + 1}
            plan={state.plan}
            executing={state.executing}
            regenerating={state.loading}
            conflictResult={state.conflictResult}
            conflictResolutions={state.conflictResolutions}
            unmatchedFiles={state.unmatchedFiles}
            filesToRemove={state.filesToRemove}
            artworkPlan={state.artworkPlan}
            artworkLoading={state.artworkLoading}
            selectedArtworkPaths={state.selectedArtworkPaths}
            initialNamingPreset={config.namingPreset}
            initialCustomNamingTemplate={config.customNamingTemplate}
            onBack={() => goToStep('search')}
            onExecute={() => executeRename()}
            onRegenerate={(destPath, namingPreset, customTemplate) =>
              generatePlan(
                config.tmdbKey, destPath, config.preferImdbId, namingPreset, customTemplate,
                {
                  subdlApiKey: config.subdlApiKey || undefined,
                  assrtToken: config.assrtToken || undefined,
                  languages: config.subtitleLanguages,
                },
              )
            }
            onSetConflictResolution={setConflictResolution}
            onSetAllConflictResolutions={setAllConflictResolutions}
            onToggleFileRemoval={toggleFileRemoval}
            onSetAllFilesToRemove={setAllFilesToRemove}
            onToggleArtwork={toggleArtworkTask}
            onSetAllArtwork={setAllArtworkSelected}
            subtitlePlan={state.subtitlePlan}
            subtitleLoading={state.subtitleLoading}
            selectedSubtitlePaths={state.selectedSubtitlePaths}
            onToggleSubtitle={toggleSubtitleTask}
            onSetAllSubtitles={setAllSubtitlesSelected}
          />
        ) : null;
      case 'execute':
        return state.executionResult ? (
          <StepExecute
            locale={locale}
            step={currentStepIndex + 1}
            result={state.executionResult}
            artworkResult={state.artworkResult}
            subtitleResult={state.subtitleResult}
            onContinue={reset}
          />
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
        onToggleLanguage={() =>
          setConfig({ displayLanguage: config.displayLanguage.startsWith('zh') ? 'en-US' : 'zh-CN' })
        }
        locale={locale}
      />
      <ContentArea error={state.error} onDismissError={() => setError(null)}>
        <Reveal key={state.currentStep}>{renderStep()}</Reveal>
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
