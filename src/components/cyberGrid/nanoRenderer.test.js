import { describe, expect, it } from 'vitest';
import { getNanoButtons, nanoHitTest, renderNanoView } from './nanoRenderer';
import { createMockCanvasContext } from '../../tests/helpers/mockCanvasContext';

describe('nanoRenderer', () => {
  it('returns expected button layouts for standard and TD-only modes', () => {
    const standard = getNanoButtons(900, 600, false);
    const tdOnly = getNanoButtons(900, 600, true);

    expect(standard).toHaveLength(4);
    expect(standard.map((btn) => btn.id)).toEqual(['workspace', 'challenge', 'td', 'td-settings']);

    expect(tdOnly).toHaveLength(2);
    expect(tdOnly.map((btn) => btn.id)).toEqual(['td', 'workspace']);
  });

  it('hit tests nano buttons correctly', () => {
    const buttons = getNanoButtons(800, 500);
    const first = buttons[0];

    expect(nanoHitTest(first.x + 10, first.y + 10, 800, 500)).toBe(first.id);
    expect(nanoHitTest(5, 5, 800, 500)).toBeNull();

    const tdButtons = getNanoButtons(800, 500, true);
    expect(nanoHitTest(tdButtons[1].x + 6, tdButtons[1].y + 6, 800, 500, true)).toBe('workspace');
  });

  it('renders rich nano view for solved and unsolved problems', () => {
    const ctx = createMockCanvasContext();

    renderNanoView(
      ctx,
      900,
      600,
      {
        slug: 'binary-tree-level-order-traversal',
        title: 'Binary Tree Level Order Traversal',
        difficulty: 'Hard',
      },
      false,
      'challenge',
      1.4,
      '#00FFFF',
      false
    );

    renderNanoView(
      ctx,
      900,
      600,
      {
        slug: 'decrypt-neural-frequency-pair',
        difficulty: 'Easy',
      },
      false,
      'workspace',
      3.1,
      '#00FFFF',
      false,
      {
        workspace: { attempted: true, completed: true, highScore: 321, bestTime: 58 },
        td: { attempted: true, completed: false, score: 77, bestTime: 95, endlessScore: 0 },
      }
    );

    renderNanoView(
      ctx,
      900,
      600,
      {
        slug: 'two-sum',
        difficulty: 'Unknown',
        referenceName: 'Two Sum',
      },
      true,
      'td',
      2.2,
      '#FF66FF',
      true
    );

    const labels = ctx.fillText.mock.calls.map(([text]) => String(text));
    expect(labels.some((text) => text.includes('UNSOLVED'))).toBe(true);
    expect(labels.some((text) => text.includes('SOLVED'))).toBe(true);
    expect(labels.some((text) => text.includes('WORKSPACE'))).toBe(true);
    expect(labels.some((text) => text.includes('TOWER DEFENSE'))).toBe(true);
    expect(labels.some((text) => text.includes('COMPLETE'))).toBe(true);
    expect(labels.some((text) => text.includes('ATTEMPTED'))).toBe(true);
    expect(labels.some((text) => text.includes('BEST SCORE 321'))).toBe(true);
    expect(labels.some((text) => text.includes('BEST TIME 58s'))).toBe(true);
    expect(
      labels.some((text) =>
        text.includes('This problem relates to classic interview problem: Two Sum')
      )
    ).toBe(true);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
