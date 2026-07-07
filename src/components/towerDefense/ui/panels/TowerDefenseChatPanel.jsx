import { Box, Text } from '@chakra-ui/react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import '../../../../styles/ChatPanel.css';
import AssistanceLevelSelector from '../../../chat/AssistanceLevelSelector';
import TowerDefenseChat from '../../chat/TowerDefenseChat';

const TowerDefenseChatPanel = forwardRef(
  (
    {
      problemId,
      onInputStart,
      shouldLoadUsage = true,
      isDisabled,
      problem,
      problemDescription,
      language,
      code,
      terminalOutput,
      isLearningMode = false,
      isMobileChatFocus = false,
      shellTheme = 'default',
    },
    ref
  ) => {
    const isRetroDesktopTheme = shellTheme === 'retro-desktop';
    const panelClassName = [
      'tower-defense-chat-panel-container',
      isMobileChatFocus ? 'mobile-chat-focus' : '',
      isRetroDesktopTheme ? 'retro-desktop-chat-panel' : '',
    ]
      .filter(Boolean)
      .join(' ');

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

    // Create a ref for the chat component
    const chatRef = useRef(null);

    // Forward the clearChatHistory method
    useImperativeHandle(
      ref,
      () => ({
        clearChatHistory: () => {
          if (chatRef.current) {
            return chatRef.current.clearChatHistory();
          }
          return false;
        },
      }),
      []
    );

    if (isDisabled) {
      return (
        <Box
          h="100%"
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(10, 0, 20, 0.8)'}
          p={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={isRetroDesktopTheme ? '0' : 'md'}
          border={isRetroDesktopTheme ? '2px solid #6b6b6b' : '1px solid rgba(128, 0, 255, 0.3)'}
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.28)'
              : '0 0 15px rgba(128, 0, 255, 0.1) inset'
          }
        >
          <Text
            color={isRetroDesktopTheme ? '#1f2128' : 'purple.300'}
            fontSize="lg"
            textAlign="center"
            fontFamily={
              isRetroDesktopTheme
                ? "'Tahoma', 'MS Sans Serif', sans-serif"
                : "'Orbitron', sans-serif"
            }
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 5px rgba(128, 0, 255, 0.5)'}
          >
            AI Assistant is unavailable for this mission
          </Text>
        </Box>
      );
    }

    return (
      <div
        className={panelClassName}
        style={{
          height: '100%',
          minHeight: 0,
          flex: '1 1 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: isRetroDesktopTheme ? '#d4d0c8' : 'rgba(15, 0, 30, 0.8)',
          border: isRetroDesktopTheme ? '2px solid #686868' : '1px solid rgba(128, 0, 255, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isRetroDesktopTheme
            ? 'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.32)'
            : '0 0 15px rgba(128, 0, 255, 0.15) inset',
          borderRadius: isRetroDesktopTheme ? '0' : '8px',
        }}
      >
        <div
          className="model-selector"
          style={{
            padding: '10px',
            position: 'relative',
            background: isRetroDesktopTheme ? '#c8c3b9' : 'rgba(26, 0, 51, 0.7)',
            borderBottom: isRetroDesktopTheme
              ? '2px solid #686868'
              : '1px solid rgba(128, 0, 255, 0.4)',
          }}
        >
          <AssistanceLevelSelector
            value={assistanceLevel}
            onChange={setAssistanceLevel}
            allowedLevels={allowedLevels}
          />
        </div>
        <div
          className="tower-defense-chat-content"
          style={{
            flex: '1',
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TowerDefenseChat
            ref={chatRef}
            problemId={problemId}
            onInputStart={onInputStart}
            shouldLoadUsage={shouldLoadUsage}
            assistanceLevel={assistanceLevel}
            problem={problem}
            problemDescription={problemDescription}
            language={language}
            code={code}
            terminalOutput={terminalOutput}
            shellTheme={shellTheme}
          />
        </div>
      </div>
    );
  }
);

export default TowerDefenseChatPanel;
