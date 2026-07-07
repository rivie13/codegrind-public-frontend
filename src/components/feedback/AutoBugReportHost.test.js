import { describe, expect, it } from 'vitest';
import { extractIssueToast } from './AutoBugReportHost';

const createToastNode = ({ status = 'error', lines = [] } = {}) => {
  const node = document.createElement('div');
  node.setAttribute('data-status', status);
  node.textContent = lines.join('\n');
  return node;
};

describe('extractIssueToast', () => {
  it('captures unexpected error toasts', () => {
    const node = createToastNode({
      lines: ['Save Failed', 'Your changes could not be saved right now.'],
    });

    expect(extractIssueToast(node)).toEqual({
      title: 'Save Failed',
      description: 'Your changes could not be saved right now.',
      fingerprint: 'save failed|your changes could not be saved right now.',
    });
  });

  it('ignores bug report submission failures', () => {
    const node = createToastNode({
      lines: ['Could not send bug report', 'Please try again in a moment.'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });

  it('ignores expected email verification auth errors', () => {
    const node = createToastNode({
      lines: ['Error', 'Email verification required'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });

  it('ignores expected invalid credential errors', () => {
    const node = createToastNode({
      lines: ['Error', 'Invalid password'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });

  it('ignores validation toasts that use error status', () => {
    const node = createToastNode({
      lines: ['Invalid Username', 'Must be 3-20 characters'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });

  it('ignores expected rate limit errors', () => {
    const node = createToastNode({
      lines: ['Error', 'Rate limit exceeded. Watch an ad to unlock more executions.'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });

  it('ignores user code test and compilation failures', () => {
    const node = createToastNode({
      lines: ['COMPILATION FAILED', 'Your tower code failed test execution.', 'Run AI Diagnostic'],
    });

    expect(extractIssueToast(node)).toBeNull();
  });
});
