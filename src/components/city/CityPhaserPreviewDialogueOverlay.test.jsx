import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APARTMENT_PREVIEW_ADVANCE_EVENT } from '../../city-phaser/district01/previewBootEvents';
import CityPhaserPreviewDialogueOverlay from './CityPhaserPreviewDialogueOverlay';

vi.mock('../../utils/audio/AudioManager', () => ({
  default: {
    getSettings: () => ({
      soundEffectsEnabled: false,
      soundEffectsVolume: 0.17,
    }),
  },
}));

describe('CityPhaserPreviewDialogueOverlay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dialogue metadata and dispatches advance when the action button is pressed', () => {
    const advanceListener = vi.fn();

    window.addEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, advanceListener);

    render(
      <CityPhaserPreviewDialogueOverlay
        dialogueState={{
          accentLabel: 'Port Meridian Police',
          footer: 'The checkpoint stays active while the city chases the breach crew.',
          nextActionLabel: 'Continue',
          statusLabel: 'Checkpoint',
          text: 'Officer: Stay on the marked route.',
          title: 'District 01 Lockdown',
          typewriterEnabled: false,
        }}
      />
    );

    expect(screen.getByTestId('city-preview-dialogue-overlay')).toBeInTheDocument();
    expect(screen.getByText('Port Meridian Police')).toBeInTheDocument();
    expect(screen.getByText('District 01 Lockdown')).toBeInTheDocument();
    expect(screen.getByText('Officer: Stay on the marked route.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(advanceListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(APARTMENT_PREVIEW_ADVANCE_EVENT, advanceListener);
  });

  it('does not render when hidden', () => {
    const { container } = render(
      <CityPhaserPreviewDialogueOverlay
        hidden
        dialogueState={{
          nextActionLabel: 'Continue',
          text: 'Intro copy',
          title: 'Port Meridian',
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
