import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TOWER_VERIFICATION_LOCK_MESSAGE } from '../../../utils/towerDefense/verificationLock';

vi.mock('../../../game-engine-v2', () => ({
  GAME_STATUS: {
    PREHACK: 'prehack',
    READY: 'ready',
    PLAYING: 'playing',
    WAVE_COMPLETE: 'wave-complete',
  },
  TOWER_TYPES: {
    FUNCTION: { type: 'Function', cost: 100, conceptKey: 'FUNCTION' },
    LOOP: { type: 'Loop', cost: 150, conceptKey: 'LOOP' },
  },
  DEPLOYABLE_TYPES: {
    FIREWALL: { type: 'Firewall', cost: 75 },
  },
}));

vi.mock('./useTowerDefenseSuggestionQueue', () => ({
  default: vi.fn(() => ({
    clearSuggestionQueueForTower: vi.fn(),
    handleCodeLineCommitted: vi.fn(),
    handleSuggestionResponse: vi.fn(() => false),
  })),
}));

vi.mock('./useTowerDefenseTerminalHelp', () => ({
  default: vi.fn(() => ({
    handleHelpOverview: vi.fn(),
    handleTowerHelp: vi.fn(),
    handleDeployableHelp: vi.fn(),
    handleGameHelp: vi.fn(),
    handleCodeHelp: vi.fn(),
  })),
}));

vi.mock('./useTowerDefenseTerminalGameAndCode', () => ({
  default: vi.fn(() => ({
    handleGameCommand: vi.fn(),
    handleCodeCommand: vi.fn(),
  })),
}));

import useTowerDefenseTerminalCommands from './useTowerDefenseTerminalCommands';

function buildProps(overrides = {}) {
  return {
    addTerminalMessage: vi.fn(),
    gameState: {
      status: 'ready',
      towers: [],
    },
    initialCodeGenerated: true,
    isLearningMode: false,
    functionTowerPlaced: true,
    objectTowerPlaced: true,
    totalWaves: 5,
    isExecuting: false,
    getReservedTowerCount: vi.fn(() => 0),
    getReservedDeployableCount: vi.fn(() => 0),
    handleTowerTypeSelect: vi.fn(),
    handleDeployableTypeSelect: vi.fn(),
    reserveTowerPlacement: vi.fn(() => ({ success: true })),
    reserveDeployablePlacement: vi.fn(() => ({ success: true })),
    resolveTypeKey: vi.fn((token, types) => {
      if (!token) return null;
      const normalized = String(token).toUpperCase();
      return (
        Object.keys(types).find(
          (key) => key === normalized || String(types[key]?.type).toUpperCase() === normalized
        ) || null
      );
    }),
    setPlacementPalette: vi.fn(),
    selectedTower: null,
    selectTowerById: vi.fn(),
    handleUpgradeSelectedTower: vi.fn(),
    handleSpecialUpgradeSelectedTower: vi.fn(),
    handleSellSelectedTower: vi.fn(),
    handleJackIn: vi.fn(),
    handleStartWave: vi.fn(),
    handleShortenPath: vi.fn(),
    handleLengthenPath: vi.fn(),
    handleCancelPlacement: vi.fn(),
    handleRunCode: vi.fn(),
    handleRunCodeOutput: vi.fn(),
    handleSubmitSolution: vi.fn(),
    shouldShowVerificationControls: false,
    isPlacementActive: false,
    towerPlacementLocked: false,
    allowedTowerTypes: null,
    coreTowerRequirements: { function: true, object: true },
    ...overrides,
  };
}

describe('useTowerDefenseTerminalCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks tower listing after verification locks placements', () => {
    const props = buildProps({ towerPlacementLocked: true });
    const { result } = renderHook(() => useTowerDefenseTerminalCommands(props));

    act(() => {
      result.current.handleTerminalCommand('/tower list');
    });

    expect(props.addTerminalMessage).toHaveBeenCalledWith('[SYSTEM] > /tower list');
    expect(props.addTerminalMessage).toHaveBeenCalledWith(
      `[WARNING] ${TOWER_VERIFICATION_LOCK_MESSAGE}`
    );
  });

  it('blocks tower purchases after verification and does not reserve a tower', () => {
    const props = buildProps({ towerPlacementLocked: true });
    const { result } = renderHook(() => useTowerDefenseTerminalCommands(props));

    act(() => {
      result.current.handleTerminalCommand('/tower buy Function --confirm');
    });

    expect(props.reserveTowerPlacement).not.toHaveBeenCalled();
    expect(props.handleTowerTypeSelect).not.toHaveBeenCalled();
    expect(props.setPlacementPalette).not.toHaveBeenCalled();
    expect(props.addTerminalMessage).toHaveBeenCalledWith(
      `[WARNING] ${TOWER_VERIFICATION_LOCK_MESSAGE}`
    );
  });
});
