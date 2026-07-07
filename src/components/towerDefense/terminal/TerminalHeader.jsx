import { Box, HStack, Text } from '@chakra-ui/react';

const TerminalHeader = ({
  title = 'TERMINAL',
  status,
  rightContent,
  isVisible = false,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  if (!isVisible) return null;

  return (
    <Box
      px={3}
      py={2}
      borderBottom={`1px solid ${isRetroDesktopTheme ? '#7d828a' : '#0f4667'}`}
      bg={isRetroDesktopTheme ? '#ece6da' : 'black'}
    >
      <HStack justify="space-between" align="center">
        <Text
          color={isRetroDesktopTheme ? '#000080' : '#00ff00'}
          fontWeight="bold"
          letterSpacing="0.08em"
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
        >
          {title}
        </Text>
        {status ? (
          <Text
            color={isRetroDesktopTheme ? '#3d4654' : '#00ccff'}
            fontSize="sm"
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : undefined}
          >
            {status}
          </Text>
        ) : null}
        {rightContent ? <Box>{rightContent}</Box> : null}
      </HStack>
    </Box>
  );
};

export default TerminalHeader;
