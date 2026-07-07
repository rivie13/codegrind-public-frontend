import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import useScoring from './useScoring';

describe('useScoring', () => {
  it('calculates progressive AI penalties with a cap', () => {
    const { result } = renderHook(() =>
      useScoring({ difficulty: 'easy', timer: 0, aiUsageCount: 0, sessionSubmissions: 0 })
    );

    expect(result.current.calculateAiPenalty(0)).toBe(0);
    expect(result.current.calculateAiPenalty(1)).toBe(50);
    expect(result.current.calculateAiPenalty(3)).toBe(225);
    expect(result.current.calculateAiPenalty(10)).toBe(400);
  });

  it('returns expected time limits per difficulty', () => {
    const { result } = renderHook(() =>
      useScoring({ difficulty: 'easy', timer: 0, aiUsageCount: 0, sessionSubmissions: 0 })
    );

    expect(result.current.getTimeLimit('EASY')).toBe(900);
    expect(result.current.getTimeLimit('medium')).toBe(1800);
    expect(result.current.getTimeLimit('Hard')).toBe(2700);
    expect(result.current.getTimeLimit('unknown')).toBe(900);
  });

  it('calculates regular-mode score and updates finalScore state', () => {
    const { result } = renderHook(() =>
      useScoring({
        difficulty: 'easy',
        timer: 180,
        aiUsageCount: 1,
        sessionSubmissions: 1,
        challenges: ['autoTimer', 'noAI'],
      })
    );

    let output;
    act(() => {
      output = result.current.calculateScore({
        totalRuntime: 1.5,
        maxMemory: 2048,
        isTimeAttack: false,
      });
    });

    expect(output.finalScore).toBe(696);
    expect(output.breakdown).toMatchObject({
      timeDeduction: 90,
      runtimeDeduction: 150,
      memoryDeduction: 30,
      submissionDeduction: 50,
      aiDeduction: 50,
      rawScore: 630,
      totalChallengeBonus: 105,
    });
    expect(result.current.finalScore).toBe(696);
  });

  it('applies challenge bonuses in time attack mode and caps final score at 1000', () => {
    const { result } = renderHook(() =>
      useScoring({
        difficulty: 'easy',
        timer: 890,
        aiUsageCount: 0,
        sessionSubmissions: 0,
        challenges: ['autoTimer', 'noAI', 'randomChars', 'matrixBomb', 'timeAttack'],
      })
    );

    let output;
    act(() => {
      output = result.current.calculateScore({
        totalRuntime: 0,
        maxMemory: 0,
        isTimeAttack: true,
      });
    });

    expect(output.breakdown).toMatchObject({
      timeDeduction: 5,
      rawScore: 995,
      totalChallengeBonus: 330,
    });
    expect(output.finalScore).toBe(1000);
    expect(result.current.finalScore).toBe(1000);
  });
});
