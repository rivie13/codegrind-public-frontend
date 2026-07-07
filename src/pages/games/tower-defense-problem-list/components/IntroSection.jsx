import { Box, Text } from '@chakra-ui/react';

function IntroSection() {
  return (
    <Box
      p={6}
      bg="#0f1012"
      borderRadius="md"
      borderWidth="1px"
      borderColor="#3d3d3d"
      position="relative"
      mb={8}
      boxShadow="0 0 20px rgba(0, 255, 255, 0.2)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '20px',
        height: '20px',
        borderTop: '1px solid #00FFFF',
        borderLeft: '1px solid #00FFFF',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '20px',
        height: '20px',
        borderBottom: '1px solid #FF00DE',
        borderRight: '1px solid #FF00DE',
      }}
    >
      <Text
        color="#00ff8c"
        mb={6}
        fontFamily="monospace"
        textShadow="0 0 5px rgba(0, 255, 140, 0.3)"
      >
        Select a corporate system to infiltrate. Each problem represents a security system with unique defenses that you'll breach using programming concepts as your hacking tools – deploy loops, variables, functions, and more to overcome each challenge.
      </Text>

      <Text color="#00FFFF" mb={4} fontFamily="monospace" fontSize="sm">
        Our AI hack assistant will help you analyze vulnerabilities and optimize your code solutions, enhancing your infiltration strategy.
      </Text>
    </Box>
  );
}

export default IntroSection;
