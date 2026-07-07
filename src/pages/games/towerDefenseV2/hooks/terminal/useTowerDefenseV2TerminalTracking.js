/**
 * Tower Defense V2 - Terminal Command Tracking
 */

import { useCallback } from 'react';

export default function useTowerDefenseV2TerminalTracking({
  setLastTerminalCommand,
  handleTerminalCommand
}) {
  const handleTerminalCommandTracked = useCallback((command) => {
    setLastTerminalCommand(command);
    handleTerminalCommand?.(command);
  }, [handleTerminalCommand, setLastTerminalCommand]);

  return { handleTerminalCommandTracked };
}
