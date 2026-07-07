import TerminalManager from '@rivie13/premium-core/sync/TerminalManager';

export const {
  formatTerminalMessage,
  isDuplicateMessage,
  addTimestamp,
  getVictoryAscii,
  getFailureAscii,
  sanitizeErrorMessage
} = TerminalManager;

export default TerminalManager;
