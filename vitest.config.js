import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 20000,
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/tests/**',
        'src/docs/**',
        'src/**/*.md',
        'src/**/*.css',
        'src/**/*.scss',
        'src/**/*.sass',
        'src/**/*.less',
        'src/assets/**',
        'src/components/towerDefense/**',
        'src/hooks/towerDefense/**',
        'src/pages/games/towerDefenseV2/**',
        'src/pages/games/ChallengeMap.jsx',
        'src/game-engine-v2/GameEngine.js',
        'src/game-engine-v2/Renderer.js',
        'src/game-engine-v2/useGameEngine.js',
      ],
    },
    // Forked workers are the more stable pool for large JSDOM suites.
    // Give each worker a larger heap and keep concurrency modest to avoid OOMs.
    pool: 'forks',
    maxWorkers: 2,
    execArgv: ['--max-old-space-size=3072'],
  },
});
