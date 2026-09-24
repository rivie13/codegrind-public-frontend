import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import useQualifierFunnel, { getReassurance } from '../../hooks/useQualifierFunnel';
import QualifierFunnel from './QualifierFunnel';
import FunnelReassurance from './FunnelReassurance';

describe('qualifier funnel', () => {
  it('experience branching', () => {
    expect(getReassurance('obstacle', 'start')).toMatch(/linear/);
    expect(getReassurance('experience', 'never')).toBeDefined();
  });

  it('renders question options', () => {
    const q = { id: 'experience', title: "What's your experience?", options: [{ value: 'never', label: 'Never coded' }] };
    render(<QualifierFunnel question={q} onAnswer={() => {}} progress={{ done: 0, total: 4 }} />);
    expect(screen.getByText('Never coded')).toBeInTheDocument();
  });

  it('renders reassurance with answer echo', () => {
    const r = { value: 'Not knowing where to start', text: 'Many learners feel this — linear paths...' };
    render(<FunnelReassurance reassurance={r} onContinue={() => {}} />);
    expect(screen.getByText(/Your answer:/)).toBeInTheDocument();
  });
});
