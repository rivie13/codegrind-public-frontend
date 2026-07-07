import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaShieldAlt, FaTimes } from 'react-icons/fa';

const CorporateDossier = ({ 
  problemTitle = "Unknown Target",
  difficulty = "unknown",
  category = "algorithmic data",
  currentWave = 1,
  isDemo = false,
  onShowGuide
}) => {
  const [showBriefing, setShowBriefing] = useState(true);

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return '#00ff88';
      case 'medium': return '#ffaa00';
      case 'hard': return '#ff3366';
      default: return '#00ccff';
    }
  };

  const getSecurityLevel = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'STANDARD';
      case 'medium': return 'ENHANCED';
      case 'hard': return 'MAXIMUM';
      default: return 'CLASSIFIED';
    }
  };

  const getEstimatedDatabits = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return '500-750';
      case 'medium': return '750-1200';
      case 'hard': return '1200-2000';
      default: return 'VARIABLE';
    }
  };

  if (!showBriefing) {
    return (
      <Flex justify="center" align="center" minHeight="200px">
        <Button
          size="sm"
          colorScheme="cyan"
          variant="outline"
          onClick={() => setShowBriefing(true)}
          fontFamily="'Orbitron', sans-serif"
          letterSpacing="1px"
        >
          VIEW CORPORATE DOSSIER
        </Button>
      </Flex>
    );
  }

  return (
    <Box
      maxWidth="100%"
      mx="auto"
      p={6}
      bg="rgba(0, 10, 25, 0.95)"
      border="2px solid #00ccff"
      borderRadius="lg"
      boxShadow="0 0 30px rgba(0, 204, 255, 0.3)"
      position="relative"
      overflow="hidden"
      data-tutorial="corporate-dossier"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(0, 204, 255, 0.05) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      {/* Header with close button */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading
          size="lg"
          color="#00ccff"
          fontFamily="'Orbitron', sans-serif"
          textShadow="0 0 10px rgba(0, 204, 255, 0.5)"
          letterSpacing="2px"
          display="flex"
          alignItems="center"
          _before={{
            content: '"🏢"',
            marginRight: '12px',
            fontSize: '24px',
          }}
        >
          CORPORATE TARGET ACQUIRED
        </Heading>
        <Button
          size="sm"
          variant="ghost"
          color="#aaccff"
          onClick={() => setShowBriefing(false)}
          _hover={{ bg: 'rgba(170, 204, 255, 0.1)' }}
        >
          <FaTimes />
        </Button>
      </Flex>

      {/* Target Information Grid */}
      <Box
        bg="rgba(0, 0, 0, 0.3)"
        border="1px solid #334455"
        borderRadius="md"
        p={4}
        mb={4}
      >
        <Flex direction="column" gap={3}>
          <Flex justify="space-between" align="center">
            <Text color="#aaccff" fontSize="sm" fontFamily="monospace">
              • Classification:
            </Text>
            <Text color="#00ffaa" fontWeight="bold" fontFamily="'Orbitron', sans-serif">
              {problemTitle}
            </Text>
          </Flex>
          
          <Flex justify="space-between" align="center">
            <Text color="#aaccff" fontSize="sm" fontFamily="monospace">
              • Security Level:
            </Text>
            <Text 
              color={getDifficultyColor(difficulty)} 
              fontWeight="bold" 
              fontFamily="'Orbitron', sans-serif"
            >
              {getSecurityLevel(difficulty)}
            </Text>
          </Flex>
          
          <Flex justify="space-between" align="center">
            <Text color="#aaccff" fontSize="sm" fontFamily="monospace">
              • Data Vault Type:
            </Text>
            <Text color="#ffaa00" fontWeight="bold" fontFamily="'Orbitron', sans-serif">
              {category}
            </Text>
          </Flex>
          
          <Flex justify="space-between" align="center">
            <Text color="#aaccff" fontSize="sm" fontFamily="monospace">
              • Estimated Databits:
            </Text>
            <Text color="#ff88cc" fontWeight="bold" fontFamily="'Orbitron', sans-serif">
              {getEstimatedDatabits(difficulty)}
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* Mission Brief */}
      <Box
        bg="rgba(0, 20, 40, 0.4)"
        border="1px solid #006699"
        borderRadius="md"
        p={4}
        mb={4}
      >
        <Heading
          size="md"
          color="#00ccff"
          mb={3}
          fontFamily="'Orbitron', sans-serif"
          letterSpacing="1px"
          display="flex"
          alignItems="center"
          _before={{
            content: '"🎯"',
            marginRight: '8px',
            fontSize: '18px',
          }}
        >
          MISSION BRIEF
        </Heading>
        <Text color="#aaccff" lineHeight="1.6" fontFamily="monospace" fontSize="sm">
          Infiltrate secure corporate databases and extract valuable algorithmic data 
          while evading ICE protocols. Deploy defensive programming modules to establish 
          a stable neural pathway for data extraction.
        </Text>
      </Box>

      {/* Tutorial Steps - Show different content for demo vs regular */}
      <Box
        bg="rgba(40, 20, 0, 0.4)"
        border="1px solid #996600"
        borderRadius="md"
        p={4}
        mb={4}
      >
        <Heading
          size="md"
          color="#ffaa00"
          mb={3}
          fontFamily="'Orbitron', sans-serif"
          letterSpacing="1px"
          display="flex"
          alignItems="center"
          _before={{
            content: '"⚡"',
            marginRight: '8px',
            fontSize: '18px',
          }}
        >
          {isDemo ? "TRAINING PROTOCOL" : "BREACH INSTRUCTIONS"}
        </Heading>
        
        {isDemo ? (
          <Text color="#ffbb44" lineHeight="1.6" fontFamily="monospace" fontSize="sm">
            <Text as="span" color="#ff6600" fontWeight="bold">DEMO ACCESS DETECTED:</Text><br />
            This is a training simulation with limited corporate access. 
            Complete the trial run to unlock full netrunner license and access 
            to advanced neural synthesis protocols.
          </Text>
        ) : (
          <Text color="#ffbb44" lineHeight="1.6" fontFamily="monospace" fontSize="sm">
            <Text as="span" color="#ff6600" fontWeight="bold">FULL ACCESS CONFIRMED:</Text><br />
            You have complete access to all neural synthesis protocols, 
            AI assistance systems, and advanced ICE countermeasures. 
            Proceed with standard infiltration procedures.
          </Text>
        )}
      </Box>

      {/* Action Buttons */}
      <Flex gap={3} justify="center" wrap="wrap">
        <Button
          colorScheme="blue"
          size="md"
          leftIcon={<FaShieldAlt />}
          onClick={onShowGuide}
          fontFamily="'Orbitron', sans-serif"
          letterSpacing="1px"
          bg="rgba(0, 100, 200, 0.2)"
          color="#66aaff"
          border="1px solid #66aaff"
          boxShadow="0 0 10px rgba(102, 170, 255, 0.2)"
          _hover={{
            bg: "rgba(0, 100, 200, 0.3)",
            boxShadow: "0 0 15px rgba(102, 170, 255, 0.3)",
          }}
        >
          SHOW NEURAL INTERFACE GUIDE
        </Button>
      </Flex>

      {/* Status Footer */}
      <Box
        mt={4}
        pt={3}
        borderTop="1px solid #334455"
        fontSize="xs"
        color="#5588aa"
        fontFamily="monospace"
        textAlign="center"
      >
        <Text>
          [System.note]: Neural interface activation required to begin framework deployment
        </Text>
      </Box>
    </Box>
  );
};

export default CorporateDossier; 