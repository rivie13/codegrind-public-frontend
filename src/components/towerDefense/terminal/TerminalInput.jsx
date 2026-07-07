import { HStack, Input, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const commandHintPulse = keyframes`
  0% {
    opacity: 0.6;
    text-shadow: 0 0 6px rgba(0, 255, 140, 0.45), 0 0 16px rgba(0, 255, 140, 0.25);
  }
  50% {
    opacity: 1;
    text-shadow: 0 0 12px rgba(0, 255, 140, 0.9), 0 0 24px rgba(0, 255, 140, 0.45);
  }
  100% {
    opacity: 0.6;
    text-shadow: 0 0 6px rgba(0, 255, 140, 0.45), 0 0 16px rgba(0, 255, 140, 0.25);
  }
`;

const TerminalInput = ({
  inputEnabled,
  inputPlaceholder,
  inputDisabledReason,
  commandInput,
  onChange,
  onKeyDown,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  return (
    <HStack spacing={2} align="center">
      <Text
        color={isRetroDesktopTheme ? '#000080' : '#00ff00'}
        fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
        fontWeight={isRetroDesktopTheme ? '700' : undefined}
      >
        {isRetroDesktopTheme ? 'C:\\>' : '>'}
      </Text>
      <Input
        data-learning="terminal-input"
        value={commandInput}
        onChange={onChange}
        onKeyDown={onKeyDown}
        borderColor={
          isRetroDesktopTheme ? '#7d828a' : inputEnabled ? 'rgba(0, 255, 140, 0.8)' : '#0f4667'
        }
        boxShadow={
          isRetroDesktopTheme
            ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.72), inset -1px -1px 0 rgba(104, 104, 104, 0.18)'
            : inputEnabled
              ? '0 0 16px rgba(0, 255, 140, 0.55)'
              : 'none'
        }
        bg={isRetroDesktopTheme ? '#ffffff' : inputEnabled ? 'rgba(0, 255, 140, 0.06)' : 'black'}
        _placeholder={
          isRetroDesktopTheme
            ? { color: '#6b7280' }
            : inputEnabled
              ? {
                  color: 'rgba(0, 255, 140, 1)',
                  animation: `${commandHintPulse} 1.5s ease-in-out infinite`,
                }
              : { color: '#00ccff80' }
        }
        _focus={{
          borderColor: isRetroDesktopTheme ? '#000080' : 'rgba(0, 255, 140, 1)',
          boxShadow: isRetroDesktopTheme ? 'none' : '0 0 20px rgba(0, 255, 140, 0.8)',
        }}
        placeholder={inputEnabled ? inputPlaceholder : inputDisabledReason}
        isDisabled={!inputEnabled}
        size="sm"
        variant="unstyled"
        color={isRetroDesktopTheme ? '#1f2430' : '#00ff00'}
        fontFamily={isRetroDesktopTheme ? "'Courier New', monospace" : 'monospace'}
        px={isRetroDesktopTheme ? 2 : 0}
        py={isRetroDesktopTheme ? 1 : 0}
      />
    </HStack>
  );
};

export default TerminalInput;
