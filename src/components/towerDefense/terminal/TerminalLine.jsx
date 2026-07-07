import { Text } from '@chakra-ui/react';

const TerminalLine = ({ content, className, isSmallScreen }) => {
  if (content === null || content === undefined) return null;

  const isAsciiArt = typeof content === 'string' && (content.includes('█') || content.includes('═'));

  return (
    <Text
      className={className}
      display="block"
      sx={{
        fontFamily: 'monospace',
        fontSize: isAsciiArt ? (isSmallScreen ? 'xs' : 'sm') : 'sm'
      }}
    >
      {content}
    </Text>
  );
};

export default TerminalLine;