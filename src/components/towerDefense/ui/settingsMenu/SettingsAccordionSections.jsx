import { Accordion } from '@chakra-ui/react';
import React from 'react';
import AudioSettingsSection from './AudioSettingsSection';
import GameplaySettingsSection from './GameplaySettingsSection';
import TerminalGlitchSettingsSection from './TerminalGlitchSettingsSection';
import VisualSettingsSection from './VisualSettingsSection';

const SettingsAccordionSections = ({
  showGameSettings,
  gameplayProps,
  audioProps,
  visualProps,
  terminalProps
}) => (
  <Accordion allowToggle defaultIndex={[0]}>
    {showGameSettings && (
      <GameplaySettingsSection {...gameplayProps} />
    )}
    <AudioSettingsSection {...audioProps} />
    <VisualSettingsSection {...visualProps} />
    <TerminalGlitchSettingsSection {...terminalProps} />
  </Accordion>
);

export default SettingsAccordionSections;
