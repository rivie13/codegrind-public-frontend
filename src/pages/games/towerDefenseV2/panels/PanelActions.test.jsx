import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { buildResponsiveProfileMock } = vi.hoisted(() => ({
  buildResponsiveProfileMock: vi.fn(() => ({
    isHandheldCompactLandscape: false,
    isHandheldSinglePanelLayout: false,
  })),
}));

vi.mock('../../../../components/towerDefense/ui/overlays/RateLimitIndicator', () => ({
  default: () => <div>Rate limit</div>,
}));

vi.mock('../../../../components/towerDefense/ui/overlays/AIGenerationProgress', () => ({
  default: () => <div>AI progress</div>,
}));

vi.mock('../../../../components/towerDefense/ui', () => ({
  SettingsButton: () => <button>Settings</button>,
}));

vi.mock('../../../../components/feedback/BugReportButton', () => ({
  default: ({ buttonLabel = 'Report Bug' }) => <button>{buttonLabel}</button>,
}));

vi.mock('../../../../utils/web/responsiveProfile', () => ({
  buildResponsiveProfile: buildResponsiveProfileMock,
}));

import { EditorPanelSlotChrome, GamePanelSlotChrome, ProblemPanelSlotChrome } from './PanelActions';

function renderProblemSlotChrome(props = {}) {
  return render(
    <ChakraProvider>
      <ProblemPanelSlotChrome
        isLearningMode={false}
        formattedTime="00:20"
        currentActionType="READY"
        {...props}
      />
    </ChakraProvider>
  );
}

function renderGameSlotChrome(props = {}) {
  return render(
    <ChakraProvider>
      <GamePanelSlotChrome
        formattedTime="00:20"
        onResetGame={vi.fn()}
        gameSettings={null}
        onGameSettingsChange={vi.fn()}
        canEditGameSettings={false}
        difficultyMinimums={null}
        {...props}
      />
    </ChakraProvider>
  );
}

function renderEditorSlotChrome(props = {}) {
  return render(
    <ChakraProvider>
      <EditorPanelSlotChrome isAnyActionInProgress={false} currentActionType="READY" {...props} />
    </ChakraProvider>
  );
}

describe('PanelActions', () => {
  beforeEach(() => {
    buildResponsiveProfileMock.mockReturnValue({
      isHandheldCompactLandscape: false,
      isHandheldSinglePanelLayout: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the tower defense bug report button in problem slot chrome', () => {
    renderProblemSlotChrome();

    expect(screen.getByRole('button', { name: /Report Bug/i })).toBeInTheDocument();
  });

  it('shows reset in game slot chrome', () => {
    renderGameSlotChrome();

    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('shows the synthesis strip on desktop editor chrome', () => {
    renderEditorSlotChrome({ isAnyActionInProgress: true, currentActionType: 'BUILDING' });

    expect(screen.getByText(/NEURAL SYNTHESIS: BUILDING/i)).toBeInTheDocument();
    expect(screen.getByText(/AI progress/i)).toBeInTheDocument();
  });

  it('hides the synthesis strip on mobile editor chrome while keeping rate limit visible', () => {
    buildResponsiveProfileMock.mockReturnValue({
      isHandheldCompactLandscape: false,
      isHandheldSinglePanelLayout: true,
    });

    renderEditorSlotChrome({ isAnyActionInProgress: true, currentActionType: 'BUILDING' });

    expect(screen.queryByText(/NEURAL SYNTHESIS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI progress/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rate limit/i)).toBeInTheDocument();
  });

  it('keeps the synthesis strip visible when the editor stays in two-slot layout', () => {
    buildResponsiveProfileMock.mockReturnValue({
      isHandheldCompactLandscape: true,
      isHandheldSinglePanelLayout: false,
    });

    renderEditorSlotChrome({ isAnyActionInProgress: true, currentActionType: 'BUILDING' });

    expect(screen.getByText(/NEURAL SYNTHESIS: BUILDING/i)).toBeInTheDocument();
    expect(screen.getByText(/AI progress/i)).toBeInTheDocument();
  });
});
