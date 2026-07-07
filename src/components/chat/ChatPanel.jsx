import { Box, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import '../../styles/ChatPanel.css';
import AssistanceLevelSelector from './AssistanceLevelSelector';
import Chat from './Chat';

const ChatPanel = ({
  problemId,
  onInputStart,
  isDisabled,
  problemData = null,
  code = '',
  executionResult = '',
  draftProblem = null,
  // Animation settings
  isHighRes,
  animationsEnabled = true,
  settings = {
    gridAnimation: { enabled: true, opacity: 0.2, speed: 30 },
    scanLineAnimation: { enabled: true, opacity: 0.5, speed: 5 },
    glitchEffects: { enabled: true, intensity: 1 },
    matrixEffects: { enabled: true, intensity: 1 },
  },
  quality = 'high',
  isLearningMode = false,
  isMobileChatFocus = false,
  theme = 'retro-desktop',
}) => {
  const initialLevel = 'hints';
  const [assistanceLevel, setAssistanceLevel] = useState(initialLevel);
  const allowedLevels = useMemo(
    () => (isLearningMode ? ['hints', 'debug', 'learning'] : null),
    [isLearningMode]
  );

  useEffect(() => {
    if (!allowedLevels) return;
    if (!allowedLevels.includes(assistanceLevel)) {
      setAssistanceLevel('hints');
    }
  }, [allowedLevels, assistanceLevel]);

  const containerClassName = [
    'chat-panel-container',
    theme === 'retro-desktop' ? 'retro-desktop-chat-panel' : 'cyberpunk-chat',
    isMobileChatFocus ? 'mobile-chat-focus' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (isDisabled) {
    return (
      <Box
        h="100%"
        bg="rgba(255,255,255,0.16)"
        p={4}
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="1px solid var(--cg-window-dark)"
        boxShadow="var(--cg-window-inset)"
      >
        <Text
          color="var(--cg-accent-red)"
          fontSize="sm"
          textAlign="center"
          fontFamily="var(--cg-font-retro-display)"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          AI assistant disabled for this challenge
        </Text>
      </Box>
    );
  }

  return (
    <div className={containerClassName}>
      <div className="model-selector">
        <AssistanceLevelSelector
          value={assistanceLevel}
          onChange={setAssistanceLevel}
          allowedLevels={allowedLevels}
        />
      </div>
      <div className="chat-content">
        <Chat
          problemId={problemId}
          onInputStart={onInputStart}
          assistanceLevel={assistanceLevel}
          problemData={problemData}
          code={code}
          executionResult={executionResult}
          draftProblem={draftProblem}
          isHighRes={isHighRes}
          animationsEnabled={animationsEnabled}
          settings={settings}
          quality={quality}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default ChatPanel;
