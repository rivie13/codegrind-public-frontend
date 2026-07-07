import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CityPhaserPreviewHud from './CityPhaserPreviewHud';

describe('CityPhaserPreviewHud', () => {
  it('renders only the minimal text HUD lines and collectible count', () => {
    render(
      <CityPhaserPreviewHud
        hudState={{
          collectibleSummaryText: 'District 01 Collectibles 0/1',
          districtLocationLabel: 'District 01: Exterior',
          placement: 'top-left',
          presentation: 'compact-objective',
          text: 'OBJ: Inspect the field disk or enter a building.',
        }}
      />
    );

    expect(screen.getByTestId('city-preview-hud-compact-objective')).toBeInTheDocument();
    expect(screen.getByText('DISTRICT 01: Exterior')).toBeInTheDocument();
    expect(
      screen.getByText('OBJ: Inspect the field disk or enter a building.')
    ).toBeInTheDocument();
    expect(screen.getByText(': 0/1')).toBeInTheDocument();
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    expect(screen.queryByText('Collectibles')).not.toBeInTheDocument();
  });

  it('does not render dialogue-overlay state as part of the persistent HUD', () => {
    const { container } = render(
      <CityPhaserPreviewHud
        hudState={{
          presentation: 'dialogue-overlay',
          text: 'Officer: Stay on the marked route.',
          title: 'District 01 Lockdown',
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
