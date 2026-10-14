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
      <EditorPanelSlotChrome {...props} />
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

  it('shows no synthesis strip in editor chrome while keeping rate limit visible', () => {
    renderEditorSlotChrome();

    expect(screen.queryByText(/NEURAL SYNTHESIS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BUILD QUEUE/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rate limit/i)).toBeInTheDocument();
  });

  it('keeps rate limit visible on mobile editor chrome', () => {
    buildResponsiveProfileMock.mockReturnValue({
      isHandheldCompactLandscape: false,
      isHandheldSinglePanelLayout: true,
    });

    renderEditorSlotChrome();

    expect(screen.queryByText(/NEURAL SYNTHESIS/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Rate limit/i)).toBeInTheDocument();
  });
});
