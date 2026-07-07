import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockSavePathChoice = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn(() => ({ isAuthenticated: false })));
const mockGuestCtx = vi.hoisted(() => ({
  xpSummary: {
    xp: 105,
    level: 1,
    roleName: 'Greenhorn',
    xpIntoLevel: 105,
    xpToNextLevel: 150,
    progressPercent: 70,
    xpRemainingToNextLevel: 45,
  },
  selectedTrialLearningPath: null,
  progress: { trialLearningPath: null },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../contexts/GuestProgressProvider', () => ({
  useGuestProgressCtx: () => mockGuestCtx,
}));

vi.mock('../../hooks/guest/useGuestFunnel', () => ({
  default: () => ({
    pathChosen: vi.fn(),
  }),
}));

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    stopAllSoundEffects: vi.fn(),
    playSoundEffect: vi.fn(),
  },
}));

vi.mock('../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  api: {
    city: {
      savePathChoice: mockSavePathChoice,
    },
  },
}));

import PathChoiceModal, { normalizeModalXpSummary } from './PathChoiceModal';

import { getGuestXpSummaryFromTotalXp } from '../../hooks/guest/useGuestProgress';

describe('normalizeModalXpSummary', () => {
  it('derives animation fields from backend-style authenticated summaries', () => {
    const totalXp = 1482;
    const normalized = normalizeModalXpSummary({
      xp: totalXp,
      level: 5,
      xpIntoLevel: 0,
      xpToNextLevel: 618,
      roleName: 'Script Kiddie',
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        ...getGuestXpSummaryFromTotalXp(totalXp),
        roleName: 'Script Kiddie',
      })
    );
    expect(normalized.progressPercent).toBeGreaterThan(0);
    expect(normalized.xpRemainingToNextLevel).toBeLessThan(normalized.xpToNextLevel);
  });
});

describe('PathChoiceModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockSavePathChoice.mockResolvedValue({ storyState: { apartmentState: 'hub' } });

    window.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    HTMLElement.prototype.scrollTo = vi.fn();
  });

  it('focuses and scrolls the xp section into view when the modal opens', async () => {
    render(
      <ChakraProvider>
        <PathChoiceModal
          isOpen
          onClose={vi.fn()}
          demoSummary={{
            xpGained: 60,
            xpSummary: {
              xp: 105,
              level: 1,
              roleName: 'Greenhorn',
              xpIntoLevel: 105,
              xpToNextLevel: 150,
            },
            previousXpSummary: {
              xp: 45,
              level: 1,
              roleName: 'Greenhorn',
              xpIntoLevel: 45,
              xpToNextLevel: 150,
            },
          }}
        />
      </ChakraProvider>
    );

    const xpSection = await screen.findByTestId('path-choice-xp-section');

    await waitFor(() => {
      expect(document.activeElement).toBe(xpSection);
      expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled();
    });
  });

  it('routes pro path choice into the apartment city entry flow', async () => {
    render(
      <ChakraProvider>
        <PathChoiceModal
          isOpen
          onClose={vi.fn()}
          selectedTrack="pro"
          demoSummary={{ xpGained: 0 }}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /I ALREADY HAVE THE SKILLS/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/city?scene=apartment-room-01&entry=path-choice&track=pro&apartmentState=hub&fallback=%2Fgames%2Fclusters'
      );
    });
  });

  it('persists authenticated path choice before routing into the city handoff', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <ChakraProvider>
        <PathChoiceModal
          isOpen
          onClose={vi.fn()}
          selectedTrack="pro"
          demoSummary={{ xpGained: 0 }}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /I ALREADY HAVE THE SKILLS/i }));

    await waitFor(() => {
      expect(mockSavePathChoice).toHaveBeenCalledWith({
        selectedTrialLearningPath: null,
        selectedTrialTrack: 'pro',
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/city?scene=apartment-room-01&entry=path-choice&track=pro&apartmentState=hub&fallback=%2Fgames%2Fclusters'
      );
    });
  });

  it('uses the provided city launch callback instead of navigating directly', async () => {
    const onLaunchCityTarget = vi.fn().mockResolvedValue(undefined);

    render(
      <ChakraProvider>
        <PathChoiceModal
          isOpen
          onClose={vi.fn()}
          onLaunchCityTarget={onLaunchCityTarget}
          selectedTrack="pro"
          demoSummary={{ xpGained: 0 }}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /I ALREADY HAVE THE SKILLS/i }));

    await waitFor(() => {
      expect(onLaunchCityTarget).toHaveBeenCalledWith(
        '/city?scene=apartment-room-01&entry=path-choice&track=pro&apartmentState=hub&fallback=%2Fgames%2Fclusters'
      );
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
