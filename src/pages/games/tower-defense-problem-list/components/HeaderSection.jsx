import { Box } from '@chakra-ui/react';

function HeaderSection() {
  return (
    <Box
      bgGradient="linear(to-r, #00ff8c, #00FFFF)"
      bgClip="text"
      fontFamily="'Orbitron', sans-serif"
      fontSize="3xl"
      fontWeight="bold"
      mb={6}
      mt={4}
      px={4}
      textShadow="0 0 10px rgba(0, 255, 255, 0.3)"
      textAlign="center"
      _before={{
        content: '"<"',
        marginRight: '8px',
        color: '#FF00DE',
      }}
      _after={{
        content: '">"',
        marginLeft: '8px',
        color: '#FF00DE',
      }}
    >
      TARGET SELECTION
    </Box>
  );
}

export default HeaderSection;
