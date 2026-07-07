import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  detectMobileDeviceMock,
  towerDefenseOnboardingControllerMock,
  writeTowerDefenseShellVisibleMock,
} = vi.hoisted(() => ({
  detectMobileDeviceMock: vi.fn(),
  towerDefenseOnboardingControllerMock: vi.fn(),
  writeTowerDefenseShellVisibleMock: vi.fn(),
}));

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    getSettings: () => ({ musicEnabled: false }),
  },
}));

vi.mock('../../utils/audio/AudioService', () => ({
  default: {
    initialize: vi.fn().mockResolvedValue(undefined),
    playBackgroundMusic: vi.fn(),
  },
}));

vi.mock('../../hooks/monaco/useGhostText', () => ({
  default: vi.fn(),
}));

vi.mock('../../utils/web/deviceDetection', () => ({
  detectMobileDevice: (...args) => detectMobileDeviceMock(...args),
}));

vi.mock('../towerDefense/onboarding/useTowerDefenseOnboardingController', () => ({
  default: (...args) => towerDefenseOnboardingControllerMock(...args),
}));

vi.mock('../../utils/ui/towerDefenseShellVisibility', () => ({
  writeTowerDefenseShellVisible: (...args) => writeTowerDefenseShellVisibleMock(...args),
}));

vi.mock('../../hooks/guest/useGuestFunnel', () => ({
  default: () => ({
    tutorialStepReached: vi.fn(),
    tutorialStepCompleted: vi.fn(),
  }),
}));

import LearningPathTowerDefenseOnboarding from './LearningPathTowerDefenseOnboarding';
import { PANEL_TYPES } from '../towerDefense/ui/layout/panelTypes';

const mountedNodes = [];
const originalMatchMedia = window.matchMedia;
const originalUserAgent = window.navigator.userAgent;
const originalMaxTouchPoints = window.navigator.maxTouchPoints;
const originalUserAgentData = window.navigator.userAgentData;

const createMatchMediaResult = (query, matches = false) => ({
  matches,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

const activeStep = {
  id: 'jack-in',
  kind: 'callout',
  title: 'Click Jack In',
  message: 'Resume the current tutorial step.',
  targetSelector: "[data-tutorial='jack-in-button']",
  panelFocus: { leftPanel: PANEL_TYPES.GAME },
};

const createProps = (overrides = {}) => ({
  isActive: true,
  onComplete: vi.fn(),
  gameState: { status: 'prehack', lives: 10 },
  onboardingId: 'lp-m0-onboarding',
  surfaceVariant: 'homepage',
  setLeftPanel: vi.fn(),
  setRightPanel: vi.fn(),
  ...overrides,
});

describe('LearningPathTowerDefenseOnboarding', () => {
  beforeEach(() => {
    detectMobileDeviceMock.mockReset();
    towerDefenseOnboardingControllerMock.mockReset();
    writeTowerDefenseShellVisibleMock.mockReset();
    detectMobileDeviceMock.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    while (mountedNodes.length > 0) {
      const node = mountedNodes.pop();
      node?.remove?.();
    }
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: originalMaxTouchPoints,
    });
    Object.defineProperty(window.navigator, 'userAgentData', {
      configurable: true,
      value: originalUserAgentData,
    });
  });

  it('reapplies the current step focus after rotating back to landscape on mobile', async () => {
    detectMobileDeviceMock.mockReturnValue(true);
    towerDefenseOnboardingControllerMock.mockReturnValue({
      activeStep,
      completeStep: vi.fn(),
    });

    window.innerWidth = 844;
    window.innerHeight = 390;

    const setLeftPanel = vi.fn();
    const setRightPanel = vi.fn();

    render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            setLeftPanel,
            setRightPanel,
          })}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(setLeftPanel).toHaveBeenCalledWith(PANEL_TYPES.GAME);
      expect(setRightPanel).toHaveBeenCalledWith(null);
    });

    setLeftPanel.mockClear();
    setRightPanel.mockClear();

    window.innerWidth = 390;
    window.innerHeight = 844;
    window.dispatchEvent(new Event('orientationchange'));

    await waitFor(() => {
      expect(setLeftPanel).not.toHaveBeenCalled();
    });

    window.innerWidth = 844;
    window.innerHeight = 390;
    window.dispatchEvent(new Event('orientationchange'));

    await waitFor(() => {
      expect(setLeftPanel).toHaveBeenCalledWith(PANEL_TYPES.GAME);
      expect(setRightPanel).toHaveBeenCalledWith(null);
    });
  });

  it('marks and auto-scrolls the slot-switch taskbar target into view', async () => {
    const slotSwitchStep = {
      id: 'interwave-slot-switch-assign',
      kind: 'callout',
      title: 'Click A Slot Switch',
      message: 'Swap the active slot.',
      targetSelector: "[data-tutorial='slot-switch-taskbar']",
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
    };

    towerDefenseOnboardingControllerMock.mockReturnValue({
      activeStep: slotSwitchStep,
      completeStep: vi.fn(),
    });

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    window.matchMedia = vi
      .fn()
      .mockImplementation((query) => createMatchMediaResult(query, query === '(pointer: fine)'));
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window.navigator, 'userAgentData', {
      configurable: true,
      value: undefined,
    });

    const taskbar = document.createElement('div');
    taskbar.setAttribute('data-tutorial', 'slot-switch-taskbar');
    taskbar.scrollIntoView = vi.fn();
    taskbar.getBoundingClientRect = () => ({
      top: 880,
      right: 980,
      bottom: 1040,
      left: 40,
      width: 940,
      height: 160,
      x: 40,
      y: 880,
      toJSON: () => ({}),
    });
    document.body.appendChild(taskbar);
    mountedNodes.push(taskbar);

    render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding {...createProps()} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(taskbar.getAttribute('data-td-onboarding-target-kind')).toBe('taskbar');
      expect(taskbar.scrollIntoView).toHaveBeenCalled();
    });
  });

  it('routes editor-focused desktop onboarding to the slot that currently holds the editor', async () => {
    towerDefenseOnboardingControllerMock.mockReturnValue({
      activeStep: {
        id: 'pro-language-warning',
        kind: 'callout',
        title: 'Lock Language Early',
        message: 'Choose your language before you build.',
        targetSelector: "[data-tutorial='code-editor']",
        panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
      },
      completeStep: vi.fn(),
    });

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    window.matchMedia = vi
      .fn()
      .mockImplementation((query) => createMatchMediaResult(query, query === '(pointer: fine)'));

    render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            surfaceVariant: 'pro',
            leftPanel: PANEL_TYPES.EDITOR,
            rightPanel: PANEL_TYPES.PROBLEM,
          })}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(window.__tdInlineOnboardingStepDetail?.step?.id).toBe('pro-language-warning');
      expect(window.__tdInlineOnboardingStepDetail?.surface).toBe('editor');
    });
  });

  it('holds slot-switch advancement until a real desktop slot reassignment settles', async () => {
    vi.useFakeTimers();

    const slotSwitchStep = {
      id: 'interwave-slot-switch-assign',
      kind: 'callout',
      title: 'Click A Slot Switch',
      message: 'Swap the active slot.',
      targetSelector: "[data-tutorial='slot-switch-taskbar']",
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
    };

    let latestContext = null;
    towerDefenseOnboardingControllerMock.mockImplementation(({ context }) => {
      latestContext = context;
      return {
        activeStep: slotSwitchStep,
        completeStep: vi.fn(),
      };
    });

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    window.matchMedia = vi
      .fn()
      .mockImplementation((query) => createMatchMediaResult(query, query === '(pointer: fine)'));

    const { rerender } = render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            leftPanel: PANEL_TYPES.GAME,
            rightPanel: PANEL_TYPES.EDITOR,
          })}
        />
      </ChakraProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(latestContext?.slotSwitchLayoutChanged).toBe(false);
    expect(latestContext?.slotSwitchAdvanceReady).toBe(false);

    rerender(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            leftPanel: PANEL_TYPES.GAME,
            rightPanel: PANEL_TYPES.PROBLEM,
          })}
        />
      </ChakraProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(latestContext?.slotSwitchLayoutChanged).toBe(true);
    expect(latestContext?.slotSwitchAdvanceReady).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2400);
    });

    expect(latestContext?.slotSwitchAdvanceReady).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(latestContext?.slotSwitchAdvanceReady).toBe(true);
  });

  it('holds desktop tower inspection advancement until the range has time to settle', async () => {
    vi.useFakeTimers();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    window.matchMedia = vi
      .fn()
      .mockImplementation((query) => createMatchMediaResult(query, query === '(pointer: fine)'));

    const inspectTowerStep = {
      id: 'inspect-function-tower',
      kind: 'callout',
      title: 'Inspect Your Tower',
      message: 'Inspect the Function tower.',
      targetSelector: "[data-tutorial='game-grid']",
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
    };

    let latestContext = null;
    towerDefenseOnboardingControllerMock.mockImplementation(({ context }) => {
      latestContext = context;
      return {
        activeStep: inspectTowerStep,
        completeStep: vi.fn(),
      };
    });

    const { rerender } = render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding {...createProps()} />
      </ChakraProvider>
    );

    expect(latestContext?.towerInspectionRangeShown).toBe(false);
    expect(latestContext?.towerInspectionAdvanceReady).toBe(false);

    rerender(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            selectedTower: { id: 7, type: 'Function' },
          })}
        />
      </ChakraProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(latestContext?.towerInspectionRangeShown).toBe(true);
    expect(latestContext?.towerInspectionAdvanceReady).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(latestContext?.towerInspectionAdvanceReady).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(latestContext?.towerInspectionAdvanceReady).toBe(true);
  });

  it('clears a lingering selected tower when the non-code tower step begins', async () => {
    const onClearSelectedTower = vi.fn();

    towerDefenseOnboardingControllerMock.mockReturnValue({
      activeStep: {
        id: 'interwave-tools',
        kind: 'callout',
        title: 'Click A Non-Code Tower',
        message: 'Select a BurstTurret or BlastTurret.',
        targetSelector: "[data-tutorial='tower-burst-turret']",
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
      },
      completeStep: vi.fn(),
    });

    render(
      <ChakraProvider>
        <LearningPathTowerDefenseOnboarding
          {...createProps({
            onClearSelectedTower,
            selectedTower: { id: 9, type: 'Function' },
          })}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(onClearSelectedTower).toHaveBeenCalledTimes(1);
    });
  });
});
