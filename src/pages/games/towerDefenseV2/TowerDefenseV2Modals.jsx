import React from 'react';
import AdModal from '../../../components/towerDefense/AdModal';
import TowerDefenseSuccessModal from '../../../components/towerDefense/TowerDefenseSuccessModal';

export default function TowerDefenseV2Modals({
  showAdModal,
  onCloseAdModal,
  onWatchAdComplete,
  showExecutionAdModal,
  onCloseExecutionAdModal,
  onExecutionAdComplete,
  executionAdOptions,
  executionRateLimit,
  selectedExecutionAd,
  selectedExecutionAdType,
  onExecutionAdTypeChange,
  isApplyingExecutionCredit,
  gameStats,
  showSuccessModal,
  onCloseSuccessModal,
  problem,
  onEnterEndlessMode,
  isLearningMode = false,
  learningNextNode = null,
  onContinueLearning,
  onReturnToMap,
  clusterNavigation = null,
  onGuestSignupWallRequested,
}) {
  return (
    <>
      <AdModal isOpen={showAdModal} onClose={onCloseAdModal} onAdComplete={onWatchAdComplete} />
      <AdModal
        isOpen={showExecutionAdModal}
        onClose={onCloseExecutionAdModal}
        onAdComplete={onExecutionAdComplete}
        title="Execution Boost"
        minViewMs={selectedExecutionAd?.minViewMs || executionAdOptions?.short?.minViewMs || 5000}
        ctaLabel={
          selectedExecutionAd
            ? `Unlock +${selectedExecutionAd.credits} Execution${selectedExecutionAd.credits > 1 ? 's' : ''}`
            : 'Select ad length to unlock executions'
        }
        footerText={
          executionRateLimit?.resetIn
            ? `Limit resets in ${Math.max(0, Math.floor(executionRateLimit.resetIn / 60))} minutes. Watching this ad adds extra executions now.`
            : 'Watching this ad adds extra code executions.'
        }
        processingText="Syncing sponsor link..."
        adTypeOptions={executionAdOptions}
        selectedAdType={selectedExecutionAdType}
        onAdTypeChange={onExecutionAdTypeChange}
        adTypeSelectionDisabled={isApplyingExecutionCredit}
        adTypeLabel="Select ad length (required to start the ad)"
        requireAdTypeSelection
        adTypeRequiredText="Choose an ad length to start the sponsor video."
        showSkipButton
        skipLabel="Maybe later"
        onSkip={onCloseExecutionAdModal}
      />
      {gameStats && (
        <TowerDefenseSuccessModal
          isOpen={showSuccessModal}
          onClose={onCloseSuccessModal}
          gameStats={gameStats}
          problemData={problem}
          problemListRoute="/games/tower-defense"
          nextProblemRouteBase="/games/tower-defense"
          onEnterEndlessMode={onEnterEndlessMode}
          isLearningMode={isLearningMode}
          learningNextNode={learningNextNode}
          onContinueLearning={onContinueLearning}
          onReturnToMap={onReturnToMap}
          clusterNavigation={clusterNavigation}
          onGuestSignupWallRequested={onGuestSignupWallRequested}
        />
      )}
    </>
  );
}
