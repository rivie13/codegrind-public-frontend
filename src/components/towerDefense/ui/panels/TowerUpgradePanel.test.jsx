import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');

  return {
    ...actual,
    Menu: ({ children }) => <div>{children}</div>,
    MenuButton: ({ children, as: Component = 'button', ...props }) => (
      <Component {...props}>{children}</Component>
    ),
    MenuList: ({ children, ...props }) => (
      <div role="menu" {...props}>
        {children}
      </div>
    ),
    MenuItem: ({ children, onClick, ...props }) => (
      <button type="button" role="menuitem" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

import TowerUpgradePanel from './TowerUpgradePanel';

// Chakra UI's Menu calls scrollTo on the menu list ref; JSDOM does not implement it.
beforeAll(() => {
  window.HTMLElement.prototype.scrollTo = () => {};
});

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderTowerUpgradePanel(overrides = {}) {
  const selectedTower = {
    id: 'tower-1',
    type: 'Array',
    color: '#FF5555',
    position: { row: 2, col: 3 },
    damage: 13,
    range: 3.2,
    attackSpeed: 0.65,
    upgradeLevel: 0,
    specialUpgradeLevel: 0,
    canUpgrade: true,
    nextUpgradeCost: 40,
    canSpecialUpgrade: true,
    nextSpecialUpgradeCost: 105,
    sellValue: 51,
    targeting: 'closest',
    effectiveTargeting: 'closest',
    targetingLocked: false,
    targetingOverride: null,
    ...overrides,
  };

  const props = {
    selectedTower,
    credits: 500,
    onUpgrade: vi.fn(),
    onSpecialUpgrade: vi.fn(),
    onTargetingChange: vi.fn(),
    onSell: vi.fn(),
    onClose: vi.fn(),
  };

  return {
    ...render(
      <ChakraProvider>
        <TowerUpgradePanel {...props} />
      </ChakraProvider>
    ),
    props,
  };
}

describe('TowerUpgradePanel', () => {
  it('shows an enabled manual targeting control when no targeting override is active', () => {
    renderTowerUpgradePanel();

    const targetingButton = screen.getByRole('button', { name: /closest/i });
    expect(targetingButton).toBeEnabled();
    expect(screen.getByText(/Active target rule: Closest/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Change how this module ranks enemies before applying duplicate-target mitigation/i
      )
    ).toBeInTheDocument();
  });

  it('locks targeting controls when a special upgrade overrides targeting', () => {
    renderTowerUpgradePanel({
      specialUpgradeLevel: 1,
      targeting: 'closest',
      effectiveTargeting: 'highest-health',
      targetingLocked: true,
      targetingOverride: 'highest-health',
    });

    const targetingButton = screen.getByRole('button', { name: /highest health/i });
    expect(targetingButton).toBeDisabled();
    expect(
      screen.getByText(/Locked by active special upgrade targeting behavior/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Active target rule: Highest Health/i)).toBeInTheDocument();
  });

  it('calls onTargetingChange with the selected mode and reflects the new selection on re-render', async () => {
    const onTargetingChange = vi.fn();
    const initialTower = {
      id: 'tower-1',
      type: 'Array',
      color: '#FF5555',
      position: { row: 2, col: 3 },
      damage: 13,
      range: 3.2,
      attackSpeed: 0.65,
      upgradeLevel: 0,
      specialUpgradeLevel: 0,
      canUpgrade: true,
      nextUpgradeCost: 40,
      canSpecialUpgrade: true,
      nextSpecialUpgradeCost: 105,
      sellValue: 51,
      targeting: 'closest',
      effectiveTargeting: 'closest',
      targetingLocked: false,
      targetingOverride: null,
    };

    const baseProps = {
      selectedTower: initialTower,
      credits: 500,
      onUpgrade: vi.fn(),
      onSpecialUpgrade: vi.fn(),
      onTargetingChange,
      onSell: vi.fn(),
      onClose: vi.fn(),
    };

    const { rerender } = render(
      <ChakraProvider>
        <TowerUpgradePanel {...baseProps} />
      </ChakraProvider>
    );

    // Open the targeting dropdown
    fireEvent.click(screen.getByRole('button', { name: /closest/i }));

    // Click the 'Furthest' menu item
    const furthestItem = await screen.findByRole('menuitem', { name: /furthest/i });
    fireEvent.click(furthestItem);

    // Verify the callback was called with the chosen mode
    expect(onTargetingChange).toHaveBeenCalledTimes(1);
    expect(onTargetingChange).toHaveBeenCalledWith('furthest');

    // Re-render with updated props to simulate the parent reflecting the change
    rerender(
      <ChakraProvider>
        <TowerUpgradePanel
          {...baseProps}
          selectedTower={{ ...initialTower, targeting: 'furthest', effectiveTargeting: 'furthest' }}
        />
      </ChakraProvider>
    );

    // The button should now display the updated mode
    expect(screen.getByRole('button', { name: /furthest/i })).toBeInTheDocument();
    expect(screen.getByText(/Active target rule: Furthest/i)).toBeInTheDocument();
  });
});
