import { Box, Portal, Text, Tooltip } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { TOWER_TYPES } from './data/towerTypes';

// Legacy V1 projectile component was removed. Keep a safe placeholder so
// this file can still be imported for TOWER_TYPES without bundling errors.
const Projectile = () => null;

export { TOWER_TYPES } from './data/towerTypes';
export { TowerEntity } from './entities/TowerEntity';

// Tower component
const Tower = ({
  type = 'ForLoop',
  level = 1,
  position = { row: 0, col: 0 },
  isSelected = false,
  onClick,
  isAttacking = false,
  targetId = null,
  cellSize = 50,
  getEnemyPosition,
  renderModeProjectileOnly = false,
  projectileStartPos = null,
}) => {
  const [projectiles, setProjectiles] = useState([]);
  const projectileIdRef = useRef(0);
  const towerRef = useRef(null);
  const [towerPosition, setTowerPosition] = useState({ top: 0, left: 0 });

  // Update the position for the range indicator portal when tower is selected
  // and also update on scroll events
  useEffect(() => {
    if (towerRef.current && isSelected) {
      // Initial position update
      updateTowerPosition();

      // Add scroll event listener to update position when scrolling
      const handleScroll = () => {
        updateTowerPosition();
      };

      // Add resize listener for window size changes
      const handleResize = () => {
        updateTowerPosition();
      };

      // Function to update tower position
      function updateTowerPosition() {
        const rect = towerRef.current.getBoundingClientRect();
        setTowerPosition({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2,
        });
      }

      // Add event listeners
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isSelected]);

  // Debug projectile creation
  useEffect(() => {
    if (isAttacking && targetId) {
      //console.log(`[DEBUG] Tower attacking: isAttacking=${isAttacking}, targetId=${targetId}`);
    }
  }, [isAttacking, targetId]);

  // Get tower properties based on type
  const towerProperties =
    Object.values(TOWER_TYPES).find((t) => t.type === type) || TOWER_TYPES.FOR_LOOP;

  // Scale stats based on level - using more balanced scaling
  const damage = towerProperties.damage * (1 + (level - 1) * 0.1); // Lower scaling
  const range = towerProperties.range + Math.floor((level - 1) / 4); // Lower range scaling
  const attackSpeed = towerProperties.attackSpeed * (1 + (level - 1) * 0.05); // Lower speed scaling

  // Debug values - uncomment if needed to debug issues
  // console.log(`Tower type: ${type}, damage: ${damage}, range: ${range}, speed: ${attackSpeed}`);
  // console.log(`Tower properties:`, towerProperties);

  // Calculate tower center position
  const towerCenterPos = {
    x: position.col * cellSize + cellSize / 2,
    y: position.row * cellSize + cellSize / 2,
  };

  // Use the provided start position or calculate from tower position
  const projectileStart = {
    x: (projectileStartPos && projectileStartPos.x) || towerCenterPos.x,
    y: (projectileStartPos && projectileStartPos.y) || towerCenterPos.y,
  };

  // Get the correct color for this tower type to ensure consistency
  const getTowerColor = () => {
    switch (type) {
      case 'ForLoop':
        return '#00FF00'; // Green
      case 'WhileLoop':
        return '#00FFCC'; // Cyan
      case 'IfCondition':
        return '#FF9900'; // Orange
      case 'Variable':
        return '#9966FF'; // Purple
      case 'Function':
        return '#3399FF'; // Blue
      case 'Array':
        return '#FF5555'; // Red
      case 'Object':
        return '#FFDD00'; // Yellow
      case 'Return':
        return '#FF33CC'; // Pink
      case 'TryCatch':
        return '#33CCCC'; // Teal
      case 'Switch':
        return '#FF99CC'; // Light Pink
      default:
        return towerProperties.color || '#FFFFFF'; // Fallback to defined color or white
    }
  };

  // Debug log tower position on mount
  useEffect(() => {
    //console.log(`[DEBUG] Tower created: type=${type}, position=(${position.row}, ${position.col}), center=(${towerCenterPos.x}, ${towerCenterPos.y})`);
  }, []);

  // Add a new projectile when the tower attacks - fix dependency array
  useEffect(() => {
    if (!isAttacking || !targetId) return;

    // Create a unique projectile ID that includes tower type for styling
    const newProjectileId = `${type}-${projectileIdRef.current++}-${Date.now()}`;

    //console.log(`[DEBUG] Creating projectile: id=${newProjectileId}, targetId=${targetId}, tower type=${type}`);

    setProjectiles((prev) => [
      ...prev,
      {
        id: newProjectileId,
        targetId: targetId,
        timestamp: Date.now(),
      },
    ]);
  }, [isAttacking, targetId, type]); // Fixed dependency array to include all relevant dependencies

  // Cleanup function for completed projectiles
  const handleProjectileComplete = (projectileId) => {
    //console.log(`[DEBUG] Projectile complete: id=${projectileId}`);
    setProjectiles((prev) => prev.filter((p) => p.id !== projectileId));
  };

  // Get the tower's color from our helper function
  const towerColor = getTowerColor();

  // Calculate tower position for projectiles
  const towerGridPosition = {
    x: position.col * cellSize + cellSize / 2,
    y: position.row * cellSize + cellSize / 2,
  };

  // Render the tower and its projectiles
  return (
    <>
      {!renderModeProjectileOnly && (
        <Tooltip
          label={
            <Box p={2}>
              <Text fontWeight="bold">
                {towerProperties.displayName || towerProperties.type} Tower (Level {level})
              </Text>
              <Text>Damage: {damage.toFixed(1)}</Text>
              <Text>Range: {range}</Text>
              <Text>Attack Speed: {attackSpeed.toFixed(1)}/s</Text>
              <Text fontSize="sm">{towerProperties.description}</Text>
            </Box>
          }
          hasArrow
          placement="top"
          openDelay={3000}
        >
          <Box
            ref={towerRef}
            width="100%"
            height="100%"
            bg={towerColor}
            opacity={isSelected ? 1 : 0.8}
            borderRadius="md"
            border={isSelected ? '3px solid white' : '2px solid rgba(255,255,255,0.5)'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontWeight="bold"
            boxShadow={
              isSelected
                ? `0 0 15px ${towerColor}, 0 0 5px white`
                : isAttacking
                  ? `0 0 15px ${towerColor}`
                  : `0 0 6px ${towerColor}`
            }
            transition="all 0.2s"
            onClick={onClick}
            cursor="pointer"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              borderRadius: 'md',
              background: isAttacking
                ? `radial-gradient(circle, ${towerColor}30, transparent 70%)`
                : 'transparent',
              opacity: isAttacking ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.3s',
              zIndex: -1,
            }}
            animation={isSelected ? 'pulse 1.5s infinite' : 'none'}
          >
            {/* Tower type initial */}
            <Text
              zIndex={2}
              sx={{
                fontSize: `${cellSize * 0.36}px`,
                '@media (max-height: 768px)': {
                  fontSize: `${cellSize * 0.4}px`,
                },
              }}
            >
              {towerProperties.type.charAt(0)}
            </Text>

            {/* Level indicator */}
            <Box
              position="absolute"
              bottom="2px"
              right="2px"
              bg="rgba(0,0,0,0.5)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                width: `${cellSize * 0.32}px`,
                height: `${cellSize * 0.32}px`,
                fontSize: `${cellSize * 0.2}px`,
                '@media (max-height: 768px)': {
                  width: `${cellSize * 0.36}px`,
                  height: `${cellSize * 0.36}px`,
                  fontSize: `${cellSize * 0.22}px`,
                },
              }}
            >
              {level}
            </Box>
          </Box>
        </Tooltip>
      )}

      {/* Render each projectile */}
      {projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          id={projectile.id}
          startPos={projectileStart}
          targetId={projectile.targetId}
          color={towerColor}
          onComplete={() => handleProjectileComplete(projectile.id)}
          getEnemyPosition={getEnemyPosition}
          towerType={type}
          towerRange={range}
          towerPosition={towerGridPosition}
        />
      ))}

      {/* Render range circle if selected */}
      {!renderModeProjectileOnly && isSelected && (
        <Portal>
          <div
            style={{
              position: 'absolute',
              top: towerPosition.top,
              left: towerPosition.left,
              width: `${range * cellSize * 2}px`,
              height: `${range * cellSize * 2}px`,
              borderRadius: '50%',
              border: `2px solid ${towerColor}`,
              backgroundColor: `${towerColor}20`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: `0 0 10px ${towerColor}50`,
            }}
          />
        </Portal>
      )}

      {/* Debug projectile renderer (for creating isolated projectiles) */}
      {renderModeProjectileOnly && projectileStartPos && (
        <Projectile
          key={`debug-${Date.now()}`}
          id={`${type}-debug-${Date.now()}`}
          startPos={projectileStartPos}
          targetId={targetId}
          color={towerColor}
          getEnemyPosition={getEnemyPosition}
          onComplete={() => {}}
          towerType={type}
          towerRange={range}
          towerPosition={towerGridPosition}
        />
      )}
    </>
  );
};

export default Tower;
