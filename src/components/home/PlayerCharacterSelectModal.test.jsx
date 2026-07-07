import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PlayerCharacterSelectModal from './PlayerCharacterSelectModal';
import { PLAYER_CHARACTER_PREVIEW_INTERVAL_MS } from '../../player-character/playerCharacterPresets';

const ControlledModal = ({ onConfirm }) => {
  const [selectedPlayerCharacterId, setSelectedPlayerCharacterId] = useState(null);

  return (
    <ChakraProvider>
      <PlayerCharacterSelectModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        onSelectCharacter={setSelectedPlayerCharacterId}
        selectedPlayerCharacterId={selectedPlayerCharacterId}
      />
    </ChakraProvider>
  );
};

describe('PlayerCharacterSelectModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires a preset selection before the demo can start', () => {
    render(
      <ChakraProvider>
        <PlayerCharacterSelectModal
          isOpen
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onSelectCharacter={vi.fn()}
          selectedPlayerCharacterId={null}
        />
      </ChakraProvider>
    );

    expect(screen.getByRole('button', { name: /start demo/i })).toBeDisabled();
  });

  it('animates each card from that preset sheet using the south-facing walk row', () => {
    vi.useFakeTimers();

    render(
      <ChakraProvider>
        <PlayerCharacterSelectModal
          isOpen
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onSelectCharacter={vi.fn()}
          selectedPlayerCharacterId={null}
        />
      </ChakraProvider>
    );

    const preview = screen.getByTestId('player-character-preview-selectable_character_05');

    expect(preview.style.backgroundImage).toContain('selectable_character_05.png');
    expect(preview.style.backgroundPosition).toBe('-1152px -256px');

    act(() => {
      vi.advanceTimersByTime(PLAYER_CHARACTER_PREVIEW_INTERVAL_MS);
    });

    expect(preview.style.backgroundPosition).toBe('-1216px -256px');
  });

  it('submits the chosen preset id when the user confirms', () => {
    const handleConfirm = vi.fn();

    render(<ControlledModal onConfirm={handleConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /character 05/i }));
    fireEvent.click(screen.getByRole('button', { name: /start demo/i }));

    expect(handleConfirm).toHaveBeenCalledWith('selectable_character_05');
  });
});
