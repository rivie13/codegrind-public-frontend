import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Select,
  Switch,
  Text,
  VStack,
  chakra,
} from '@chakra-ui/react';
import { ENEMY_TYPES } from '../game-engine-v2/constants.js';
import { drawEnemy } from '../game-engine-v2/renderer/enemies.js';
import { drawGrid, drawPath } from '../game-engine-v2/renderer/grid.js';

const Canvas = chakra('canvas');

const CELL_SIZE = 56;
const GRID_COLS = 16;
const GRID_ROWS = 9;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

const PATH_NODES = [
  [1, 0],
  [1, 2],
  [2, 4],
  [2, 6],
  [3, 8],
  [4, 10],
  [4, 12],
  [5, 14],
  [7, 15],
];

const ENEMY_TYPE_ORDER = [
  'basic',
  'edge',
  'complex',
  'timeLimit',
  'hijacker',
  'buffer',
  'pathShaper',
  'spaceComplex',
];

const getEnemyDefinitions = () => {
  const defs = Object.values(ENEMY_TYPES);
  return ENEMY_TYPE_ORDER
    .map((type) => defs.find((enemy) => enemy.type === type))
    .filter(Boolean);
};

const interpolatePathPosition = (progress) => {
  const clamped = ((progress % 1) + 1) % 1;
  const maxIndex = PATH_NODES.length - 1;
  const exactIndex = clamped * maxIndex;
  const pathIndex = Math.floor(exactIndex);
  const nextIndex = Math.min(pathIndex + 1, maxIndex);
  const t = exactIndex - pathIndex;

  const [row1, col1] = PATH_NODES[pathIndex];
  const [row2, col2] = PATH_NODES[nextIndex];

  const row = row1 + (row2 - row1) * t;
  const col = col1 + (col2 - col1) * t;

  const x = (col + 0.5) * CELL_SIZE;
  const y = (row + 0.5) * CELL_SIZE;
  const headingAngle = Math.atan2(row2 - row1, col2 - col1);

  return { x, y, headingAngle };
};

function TowerDefenseEnemyLabPage() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const previousFrameRef = useRef(0);
  const enemiesRef = useRef([]);

  const [performanceTier, setPerformanceTier] = useState('normal');
  const [speedMultiplier, setSpeedMultiplier] = useState(2.4);
  const [isPaused, setIsPaused] = useState(false);
  const [simulateLowHp, setSimulateLowHp] = useState(true);
  const [simulateHijackLatch, setSimulateHijackLatch] = useState(true);

  const enemyDefinitions = useMemo(() => getEnemyDefinitions(), []);

  useEffect(() => {
    enemiesRef.current = enemyDefinitions.map((enemyDef, index) => ({
      id: `lab-${enemyDef.type}-${index}`,
      type: enemyDef.type,
      color: enemyDef.color,
      size: enemyDef.size,
      maxHealth: enemyDef.health,
      health: enemyDef.health,
      progress: (index / enemyDefinitions.length) * 0.92,
      speed: enemyDef.speed,
      phaseOffset: index * 0.9,
      isActive: true,
      isHit: false,
      isSlowed: enemyDef.type === 'buffer',
      isFrozen: false,
      isBoss: enemyDef.type === 'spaceComplex',
      hijackedTowerId: null,
      spawnTime: Date.now(),
      headingAngle: 0,
    }));
  }, [enemyDefinitions]);

  useEffect(() => {
    const renderLoop = (timestamp) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        rafRef.current = window.requestAnimationFrame(renderLoop);
        return;
      }

      const previous = previousFrameRef.current || timestamp;
      const deltaTime = Math.max(8, Math.min(40, timestamp - previous));
      previousFrameRef.current = timestamp;

      const glowPhase = timestamp * 0.002;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const renderer = {
        ctx,
        settings: {
          showGrid: true,
          glowEffects: true,
        },
        performanceTier,
        glowPhase,
        gridCols: GRID_COLS,
        gridRows: GRID_ROWS,
        logicalWidth: CANVAS_WIDTH,
        logicalHeight: CANVAS_HEIGHT,
        cellSize: CELL_SIZE,
        pathNodes: PATH_NODES,
      };

      drawGrid(renderer);
      drawPath(renderer);

      const now = Date.now();

      enemiesRef.current.forEach((enemy, index) => {
        if (!isPaused) {
          enemy.progress += enemy.speed * speedMultiplier * (deltaTime / 16.67);
          enemy.progress %= 1;
        }

        const { x, y, headingAngle } = interpolatePathPosition(enemy.progress);
        enemy.x = x;
        enemy.y = y;
        enemy.headingAngle = headingAngle;

        const pulse = (Math.sin(glowPhase * 2.2 + enemy.phaseOffset) + 1) / 2;
        enemy.health = simulateLowHp
          ? Math.max(1, enemy.maxHealth * (0.18 + pulse * 0.82))
          : enemy.maxHealth;

        enemy.isHit = pulse > 0.92;
        enemy.hijackedTowerId =
          simulateHijackLatch && enemy.type === 'hijacker' && pulse > 0.55 ? 'lab-tower' : null;

        drawEnemy(renderer, enemy, performanceTier);

        ctx.save();
        ctx.fillStyle = '#d9efff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.type, enemy.x, enemy.y - enemy.size - 18);
        if (index === 0) {
          ctx.fillStyle = '#7be4ff';
          ctx.fillText('enemy lab preview', enemy.x, enemy.y - enemy.size - 34);
        }
        ctx.restore();
      });

      rafRef.current = window.requestAnimationFrame(renderLoop);
    };

    rafRef.current = window.requestAnimationFrame(renderLoop);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPaused, performanceTier, simulateHijackLatch, simulateLowHp, speedMultiplier]);

  return (
    <Box minH="100vh" bg="#02040a" p={{ base: 3, md: 5 }} color="#e7f7ff">
      <VStack align="stretch" spacing={4} maxW="1200px" mx="auto">
        <Box border="1px solid rgba(0, 255, 255, 0.35)" bg="rgba(0, 12, 18, 0.5)" p={4}>
          <Text fontFamily="'Orbitron', sans-serif" fontWeight="bold" letterSpacing="0.08em">
            LOCAL ENEMY LAB (NO LEVEL GATING)
          </Text>
          <Text mt={2} fontSize="sm" color="#9ed2ea">
            Route: /local/tower-defense-enemy-lab. This page is local-only and intended for visual
            tuning of enemies and future bosses.
          </Text>
        </Box>

        <HStack flexWrap="wrap" spacing={3} align="center">
          <Button onClick={() => setIsPaused((value) => !value)} colorScheme="cyan" variant="outline">
            {isPaused ? 'Resume' : 'Pause'}
          </Button>

          <Select
            value={performanceTier}
            onChange={(event) => setPerformanceTier(event.target.value)}
            maxW="180px"
            bg="#07131e"
            borderColor="rgba(0,255,255,0.35)"
          >
            <option value="normal">Tier: normal</option>
            <option value="low">Tier: low</option>
            <option value="ultra">Tier: ultra</option>
          </Select>

          <Select
            value={String(speedMultiplier)}
            onChange={(event) => setSpeedMultiplier(Number(event.target.value))}
            maxW="180px"
            bg="#07131e"
            borderColor="rgba(0,255,255,0.35)"
          >
            <option value="1.2">Speed x1.2</option>
            <option value="2.4">Speed x2.4</option>
            <option value="3.5">Speed x3.5</option>
          </Select>

          <HStack spacing={2}>
            <Switch isChecked={simulateLowHp} onChange={(event) => setSimulateLowHp(event.target.checked)} />
            <Text fontSize="sm">Low-HP stress</Text>
          </HStack>

          <HStack spacing={2}>
            <Switch
              isChecked={simulateHijackLatch}
              onChange={(event) => setSimulateHijackLatch(event.target.checked)}
            />
            <Text fontSize="sm">Hijacker latch pulse</Text>
          </HStack>
        </HStack>

        <Box border="1px solid rgba(0, 255, 136, 0.35)" bg="#030a10" p={2} overflowX="auto">
          <Canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            display="block"
            minW={`${CANVAS_WIDTH}px`}
            style={{ imageRendering: 'auto' }}
          />
        </Box>
      </VStack>
    </Box>
  );
}

export default [
  {
    path: '/local/tower-defense-enemy-lab',
    element: <TowerDefenseEnemyLabPage />,
  },
];
