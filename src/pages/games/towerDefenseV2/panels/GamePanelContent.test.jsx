import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { writeTowerDefenseShellVisibleMock, useAuthMock } = vi.hoisted(() => ({
  writeTowerDefenseShellVisibleMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('../../../../components/towerDefense/TowerSelector', () => ({
  default: () => <div data-testid="tower-selector">Tower Selector</div>,
}));

vi.mock('../../../../components/towerDefense/data/towerTypes', () => ({
  TOWER_TYPES: {
    FUNCTION: {
      type: 'Function',
      cost: 110,
      conceptKey: 'FUNCTION',
    },
    RETURN: {
      type: 'Return',
      cost: 130,
      conceptKey: 'RETURN_STATEMENT',
    },
    OBJECT: {
      type: 'Object',
      cost: 90,
      conceptKey: 'OBJECT',
    },
    BURST: {
      type: 'BurstTower',
      cost: 75,
      conceptKey: 'BURST',
    },
    BLAST: {
      type: 'BlastTower',
      cost: 95,
      conceptKey: 'BLAST',
    },
  },
}));

vi.mock('../../../../components/towerDefense/ui/DeployableSelector', () => ({
  default: () => <div data-testid="deployable-selector">Deployable Selector</div>,
}));

vi.mock('../../../../components/towerDefense/ui', () => ({
  TowerUpgradePanel: () => <div data-testid="tower-upgrade-panel">Tower Upgrade</div>,
}));

vi.mock('../../../../components/towerDefense/ui/board/GameBoard', () => ({
  default: ({ children }) => <div data-testid="game-board">{children}</div>,
}));

vi.mock('../../../../components/limits/CodeExecutionRateLimitBadge', () => ({
  default: () => null,
}));

vi.mock('../../../../components/auth/AuthForms', () => ({
  default: () => <div data-testid="auth-forms">Auth Forms</div>,
}));

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../../utils/game/VisualSettingsManager', () => ({
  default: {
    getSettings: () => ({
      canvasGlitchEnabled: false,
      canvasGlitchIntensity: 0,
      canvasFlickerEnabled: false,
      canvasFlickerIntensity: 0,
      canvasFlashEnabled: false,
      canvasFlashIntensity: 0,
    }),
  },
}));

vi.mock('../../../../utils/towerDefense/coreTowerRequirements', () => ({
  formatCoreTowerList: () => 'Function and Object',
  getMissingCoreTowerLabels: () => [],
}));

vi.mock('../../../../utils/ui/towerDefenseShellVisibility', () => ({
  TOWER_DEFENSE_SHELL_VISIBILITY_EVENT: 'td-shell-visibility',
  readTowerDefenseShellVisible: () => false,
  writeTowerDefenseShellVisible: writeTowerDefenseShellVisibleMock,
}));

vi.mock('../../../../game-engine-v2', () => ({
  DEPLOYABLE_TYPES: {
    DATA_MINE: {
      key: 'DATA_MINE',
      type: 'Data Mine',
      cost: 35,
      placementType: 'path',
      icon: '💣',
    },
    LOGIC_BOMB: {
      key: 'LOGIC_BOMB',
      type: 'Logic Bomb',
      cost: 90,
      placementType: 'any',
      icon: '☠️',
    },
  },
}));

import GamePanelContent from './GamePanelContent';
import { resolveCanvasFitScale, resolveMobileCanvasViewportHeight } from './gamePanelSizing';

const createProps = (overrides = {}) => {
  const baseGameState = {
    status: 'wave-complete',
    wave: 2,
    totalWaves: 2,
    lives: 10,
    credits: 250,
    enemiesRemaining: 0,
    isEndlessMode: false,
    endlessWave: 1,
    endlessSurvivalTime: 0,
  };

  const baseProps = {
    isGameOver: false,
    isVictory: false,
    gameState: baseGameState,
    initialLives: 10,
    formattedTime: '01:12',
    codeSubmissionSuccess: false,
    onResetGame: vi.fn(),
    onNavigateToList: vi.fn(),
    navigateToListLabel: 'Back',
    canvasRefCallback: vi.fn(),
    canvasWidth: 640,
    canvasHeight: 360,
    isTowerPlacementMode: false,
    onCanvasClick: vi.fn(),
    onCanvasMouseMove: vi.fn(),
    onCanvasMouseLeave: vi.fn(),
    showJackInButton: false,
    showStartWaveButton: false,
    onJackIn: vi.fn(),
    onStartWave: vi.fn(),
    autoStartCountdown: null,
    autoStartWaves: false,
    hardcoreMode: false,
    initialCodeGenerated: true,
    functionTowerPlaced: true,
    objectTowerPlaced: true,
    selectedTowerType: 'FUNCTION',
    selectedDeployableType: null,
    placementModeKind: 'tower',
    selectedTower: null,
    onUpgradeSelectedTower: vi.fn(),
    onSpecialUpgradeSelectedTower: vi.fn(),
    onSetSelectedTowerTargeting: vi.fn(),
    onSellSelectedTower: vi.fn(),
    onClearSelectedTower: vi.fn(),
    onSelectTowerType: vi.fn(),
    onSelectDeployableType: vi.fn(),
    placementPalette: 'towers',
    onPlacementPaletteChange: vi.fn(),
    onCancelPlacement: vi.fn(),
    allowedTowerTypes: ['FUNCTION', 'OBJECT', 'BURST', 'BLAST'],
    towerUnlockGates: {},
    deployableUnlockGates: {},
    isSpecialUpgradeUnlocked: false,
    towerSelectorEnabled: true,
    deployableMenuEnabled: false,
    isMapLoading: false,
    canAdjustPath: true,
    isAdjustingPath: false,
    onShortenPath: vi.fn(),
    onLengthenPath: vi.fn(),
    pathActionCosts: { shorten: 50, lengthen: 50 },
    shouldShowVerificationControls: true,
    onRunCode: vi.fn(),
    onRunOutput: vi.fn(),
    onSubmitSolution: vi.fn(),
    verificationActionCosts: { runTests: 0, stdout: 0, stderr: 0 },
    isExecuting: false,
    codeSubmitted: false,
    isLearningMode: false,
    terminalOutput: '',
    isHomepageDemo: false,
    slotSwitcherControl: <button type="button">Slot Switcher</button>,
    slotChrome: null,
    isMobileSlotLayout: true,
  };

  return {
    ...baseProps,
    ...overrides,
    gameState: {
      ...baseGameState,
      ...(overrides.gameState || {}),
    },
  };
};

const openMobileQuickActions = async () => {
  fireEvent.click(screen.getByRole('button', { name: /open tower defense quick actions/i }));
  return within(await screen.findByTestId('mobile-tower-dock'));
};

describe('GamePanelContent mobile loadout behavior', () => {
  beforeEach(() => {
    vi.useRealTimers();
    writeTowerDefenseShellVisibleMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({ isAuthenticated: true });
  });

  it('uses the tighter mobile fit constraint with a safety margin', async () => {
    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(function clientWidthGetter() {
        return this.getAttribute?.('data-tutorial') === 'game-canvas' ? 960 : 0;
      });
    const clientHeightSpy = vi
      .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
      .mockImplementation(function clientHeightGetter() {
        return this.getAttribute?.('data-tutorial') === 'game-canvas' ? 420 : 0;
      });

    render(
      <ChakraProvider>
        <GamePanelContent {...createProps({ canvasWidth: 640, canvasHeight: 360 })} />
      </ChakraProvider>
    );

    const gameBoard = screen.getByTestId('game-board');

    await waitFor(() => {
      const canvas = gameBoard.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas.style.width).toBe('513px');
      expect(canvas.style.height).toBe('289px');
    });

    clientWidthSpy.mockRestore();
    clientHeightSpy.mockRestore();
  });

  it('tags the first-wave game start button with the dedicated onboarding target', () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            isMobileSlotLayout: false,
            showStartWaveButton: true,
            gameState: {
              status: 'wave-complete',
              wave: 1,
            },
          })}
        />
      </ChakraProvider>
    );

    expect(screen.getByRole('button', { name: /start wave 1/i })).toHaveAttribute(
      'data-tutorial',
      'game-start-wave-button'
    );
  });

  it('does not force-open loadout when verify controls are visible', () => {
    render(
      <ChakraProvider>
        <GamePanelContent {...createProps()} />
      </ChakraProvider>
    );

    expect(screen.getByText(/verify before final wave/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open loadout/i })).toBeInTheDocument();
    expect(screen.queryByText('TACTICAL LOADOUT')).not.toBeInTheDocument();
  });

  it('renders the mobile hud as an overlay inside the canvas in mobile mode', () => {
    render(
      <ChakraProvider>
        <GamePanelContent {...createProps()} />
      </ChakraProvider>
    );

    const gameBoard = screen.getByTestId('game-board');
    const gameCanvas = gameBoard.querySelector('[data-tutorial="game-canvas"]');

    expect(gameCanvas).not.toBeNull();
    expect(screen.getByRole('button', { name: /hide ui/i })).toBeInTheDocument();
    expect(screen.getByText(/bits: 250/i)).toBeInTheDocument();

    const canvasQueries = within(gameCanvas);
    expect(canvasQueries.getByRole('button', { name: /hide ui/i })).toBeInTheDocument();
    expect(canvasQueries.getByText(/bits: 250/i)).toBeInTheDocument();
  });

  it('keeps loadout openable before verify solution in mobile mode', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent {...createProps()} />
      </ChakraProvider>
    );

    expect(screen.getByText(/verify before final wave/i)).toBeInTheDocument();
    const openLoadoutButton = screen.getByRole('button', { name: /open loadout/i });

    fireEvent.click(openLoadoutButton);

    await waitFor(() => {
      expect(screen.getByText('TACTICAL LOADOUT')).toBeInTheDocument();
      expect(screen.getByTestId('tower-selector')).toBeInTheDocument();
    });
  });

  it('opens the loadout when an existing tower is selected', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            selectedTower: { id: 7, type: 'Function' },
          })}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /open tower defense quick actions/i })
      ).toBeInTheDocument();
    });

    expect(writeTowerDefenseShellVisibleMock).toHaveBeenCalledWith(false);
  });

  it('opens full tower details when the mobile tower details event is dispatched', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            selectedTower: { id: 7, type: 'Function', range: 2.5, targeting: 'closest' },
          })}
        />
      </ChakraProvider>
    );

    window.dispatchEvent(
      new CustomEvent('td-mobile-open-tower-details', {
        detail: { towerId: 7, source: 'test' },
      })
    );

    const dock = within(await screen.findByTestId('mobile-tower-dock'));

    expect(dock.getByRole('button', { name: /upgrade/i })).toBeInTheDocument();
    expect(dock.getByRole('button', { name: /special/i })).toBeInTheDocument();
    expect(dock.getByRole('button', { name: /target furthest/i })).toBeInTheDocument();

    expect(screen.queryByText('TACTICAL LOADOUT')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tower-upgrade-panel')).not.toBeInTheDocument();
  });

  it('collapses the mobile loadout and hides shell state when a wave starts', async () => {
    const { rerender } = render(
      <ChakraProvider>
        <GamePanelContent {...createProps()} />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open loadout/i }));

    await waitFor(() => {
      expect(screen.getByText('TACTICAL LOADOUT')).toBeInTheDocument();
    });

    rerender(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            shouldShowVerificationControls: false,
            gameState: {
              ...createProps().gameState,
              status: 'playing',
              enemiesRemaining: 5,
            },
          })}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('TACTICAL LOADOUT')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show ui/i })).toBeInTheDocument();
    });

    expect(writeTowerDefenseShellVisibleMock).toHaveBeenCalledWith(false);
  });

  it('collapses the loadout during tower placement and exposes a cancel purchase button', async () => {
    const onCancelPlacement = vi.fn();
    const { rerender } = render(
      <ChakraProvider>
        <GamePanelContent {...createProps({ onCancelPlacement })} />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open loadout/i }));

    await waitFor(() => {
      expect(screen.getByText('TACTICAL LOADOUT')).toBeInTheDocument();
    });

    rerender(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            onCancelPlacement,
            isTowerPlacementMode: true,
            selectedTowerType: 'BurstTurret',
            placementModeKind: 'tower',
          })}
        />
      </ChakraProvider>
    );

    const cancelPurchaseButton = await screen.findByRole('button', { name: /cancel purchase/i });

    expect(screen.queryByText('TACTICAL LOADOUT')).not.toBeInTheDocument();
    fireEvent.click(cancelPurchaseButton);
    expect(onCancelPlacement).toHaveBeenCalledTimes(1);
    expect(writeTowerDefenseShellVisibleMock).toHaveBeenCalledWith(false);
  });

  it('shows a mobile tower dock with quick actions when a tower is selected', async () => {
    const onUpgradeSelectedTower = vi.fn();
    const onSpecialUpgradeSelectedTower = vi.fn();
    const onSetSelectedTowerTargeting = vi.fn();
    const onSellSelectedTower = vi.fn();

    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
              targetingLocked: false,
              nextUpgradeCost: 50,
              canSpecialUpgrade: true,
              nextSpecialUpgradeCost: 80,
            },
            onUpgradeSelectedTower,
            onSpecialUpgradeSelectedTower,
            onSetSelectedTowerTargeting,
            onSellSelectedTower,
          })}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open tower defense quick actions/i }));
    const dock = await screen.findByTestId('mobile-tower-dock');
    const dockQueries = within(dock);

    fireEvent.click(dockQueries.getByRole('button', { name: /upgrade \(50\)/i }));
    fireEvent.click(dockQueries.getByRole('button', { name: /special \(80\)/i }));
    fireEvent.click(dockQueries.getByRole('button', { name: /target furthest/i }));
    fireEvent.click(dockQueries.getByRole('button', { name: /sell tower/i }));

    expect(onUpgradeSelectedTower).toHaveBeenCalledTimes(1);
    expect(onSpecialUpgradeSelectedTower).toHaveBeenCalledTimes(1);
    expect(onSetSelectedTowerTargeting).toHaveBeenCalledWith('furthest');
    expect(onSellSelectedTower).toHaveBeenCalledTimes(1);
  });

  it('pins the mobile tower dock to the lower-left viewport corner', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
            },
          })}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open tower defense quick actions/i }));

    const dock = await screen.findByTestId('mobile-tower-dock');

    expect(dock.parentElement).toHaveStyle({
      position: 'fixed',
      left: 'calc(env(safe-area-inset-left, 0px) + 10px)',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
    });
  });

  it('shows quick deployables with cost and lock state in the mobile dock', async () => {
    const onSelectDeployableType = vi.fn();
    const onPlacementPaletteChange = vi.fn();

    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            placementPalette: 'deployables',
            onPlacementPaletteChange,
            selectedTower: null,
            onSelectDeployableType,
            deployableUnlockGates: {
              LOGIC_BOMB: { locked: true, minLevel: 6, requiredDp: 30 },
            },
            gameState: {
              ...createProps().gameState,
              credits: 40,
            },
          })}
        />
      </ChakraProvider>
    );

    const dock = await openMobileQuickActions();
    const dataMineButton = await dock.findByRole('button', { name: /data mine/i });
    const logicBombButton = dock.getByRole('button', { name: /logic bomb/i });

    expect(dock.getByText(/quick deployables/i)).toBeInTheDocument();
    expect(dock.getByText(/35 bits/i)).toBeInTheDocument();
    expect(dock.getByText(/l6 • 30 dp/i)).toBeInTheDocument();
    expect(logicBombButton).toBeDisabled();

    fireEvent.click(dataMineButton);

    expect(onSelectDeployableType).toHaveBeenCalledWith('DATA_MINE');
  });

  it('shows quick towers in the mobile dock and lets players switch palettes', async () => {
    const onSelectTowerType = vi.fn();
    const onPlacementPaletteChange = vi.fn();

    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            placementPalette: 'towers',
            selectedTower: null,
            onSelectTowerType,
            onPlacementPaletteChange,
          })}
        />
      </ChakraProvider>
    );

    const dockQueries = await openMobileQuickActions();

    expect(dockQueries.getByText(/quick towers/i)).toBeInTheDocument();
    expect(dockQueries.getByRole('button', { name: /object/i })).toBeInTheDocument();

    fireEvent.click(dockQueries.getByRole('button', { name: /deploy/i }));
    fireEvent.click(dockQueries.getByRole('button', { name: /object/i }));

    expect(onPlacementPaletteChange).toHaveBeenCalledWith('deployables');
    expect(onPlacementPaletteChange).toHaveBeenCalledWith('towers');
    expect(onSelectTowerType).toHaveBeenCalledWith('Object');
  });

  it('keeps the expanded mobile dock vertically scrollable so quick buys stay reachable', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            placementPalette: 'deployables',
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
              nextUpgradeCost: 50,
              nextSpecialUpgradeCost: 90,
            },
          })}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open tower defense quick actions/i }));

    const dock = await screen.findByTestId('mobile-tower-dock');

    expect(dock).toHaveStyle({
      overflowY: 'auto',
      overflowX: 'hidden',
    });
    expect(within(dock).getByText(/quick deployables/i)).toBeInTheDocument();
  });

  it('uses the same tower identifier as the loadout selector for return tower purchases', async () => {
    const onSelectTowerType = vi.fn();

    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            placementPalette: 'towers',
            selectedTower: null,
            onSelectTowerType,
            allowedTowerTypes: ['RETURN_STATEMENT', 'FUNCTION', 'OBJECT'],
          })}
        />
      </ChakraProvider>
    );

    const dockQueries = await openMobileQuickActions();
    fireEvent.click(dockQueries.getByRole('button', { name: /return/i }));

    expect(onSelectTowerType).toHaveBeenCalledWith('Return');
  });

  it('keeps the mobile action dock collapsed until the user opens it', () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
            },
          })}
        />
      </ChakraProvider>
    );

    expect(
      screen.getByRole('button', { name: /open tower defense quick actions/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/quick actions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/quick deployables/i)).not.toBeInTheDocument();
  });

  it('keeps the mobile dock gameplay-only for guests', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });

    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            deployableMenuEnabled: true,
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
            },
          })}
        />
      </ChakraProvider>
    );

    const dockQueries = await openMobileQuickActions();

    expect(
      dockQueries.queryByRole('button', { name: /sign up \/ login/i })
    ).not.toBeInTheDocument();
  });

  it('hides the mobile action dock when the game slot is not the active mobile panel', () => {
    render(
      <ChakraProvider>
        <GamePanelContent
          {...createProps({
            isMobileChatFocus: true,
            selectedTower: {
              id: 7,
              type: 'Function',
              range: 2.5,
              targeting: 'closest',
              effectiveTargeting: 'closest',
            },
          })}
        />
      </ChakraProvider>
    );

    expect(
      screen.queryByRole('button', { name: /open tower defense quick actions/i })
    ).not.toBeInTheDocument();
  });

  it('collapses mobile loadout and hud when the onboarding requests it', async () => {
    render(
      <ChakraProvider>
        <GamePanelContent {...createProps()} />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /open loadout/i }));

    await waitFor(() => {
      expect(screen.getByText('TACTICAL LOADOUT')).toBeInTheDocument();
    });

    window.dispatchEvent(
      new CustomEvent('td-mobile-collapse-ui', {
        detail: {
          closeLoadout: true,
          hideHud: true,
          hideShell: true,
        },
      })
    );

    await waitFor(() => {
      expect(screen.queryByText('TACTICAL LOADOUT')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show ui/i })).toBeInTheDocument();
    });

    expect(writeTowerDefenseShellVisibleMock).toHaveBeenCalledWith(false);
  });
});

describe('GamePanelContent sizing helpers', () => {
  it('uses the tighter width or height constraint for the mobile board and applies a safety margin', () => {
    expect(
      resolveCanvasFitScale({
        availableCanvasWidth: 960,
        availableCanvasHeight: 304,
        canvasWidth: 640,
        canvasHeight: 360,
        isMobileCanvasMode: true,
      })
    ).toBeCloseTo(0.802, 3);
  });

  it('locks the mobile canvas viewport height to the measured slot height when available', () => {
    expect(
      resolveMobileCanvasViewportHeight({
        canvasViewportHeight: 466,
        displayCanvasHeight: 340,
        topHudClearance: 96,
        bottomHudClearance: 12,
      })
    ).toBe(466);
  });
});
