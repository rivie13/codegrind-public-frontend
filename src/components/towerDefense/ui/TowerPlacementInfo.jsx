import { Box, Text } from '@chakra-ui/react';
import React from 'react';
import { TOWER_TYPES } from '../data/towerTypes';

const TowerPlacementInfo = ({ selectedTowerType, isTowerPlacementMode }) => {
  if (!selectedTowerType || !isTowerPlacementMode) return null;

  const tower = Object.values(TOWER_TYPES).find((value) => value.type === selectedTowerType);
  const towerColor = tower ? tower.color : '#00ccff';

  return (
    <Box
      position="absolute"
      top="10px"
      right="10px"
      bg="rgba(0,10,30,0.8)"
      p={2}
      borderRadius="sm"
      fontSize="xs"
      color="#ffffff"
      fontFamily="monospace"
      zIndex={2}
      boxShadow="0 0 10px rgba(0,0,0,0.5)"
      border="1px solid"
      borderColor={towerColor}
    >
      <Text color={towerColor}>{selectedTowerType} module ready</Text>
      <Text fontSize="10px" color="#aaccff">Click on grid to deploy</Text>
    </Box>
  );
};

export default TowerPlacementInfo;
