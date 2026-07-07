import { useCallback, useRef, useState } from 'react';

import { normalizeTerminalOutput as normalizeTerminalOutputHelper } from '../../helpers';

const toTerminalText = (entry) => {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return '';
  if (typeof entry.text === 'string') return entry.text;
  if (typeof entry.message === 'string') return entry.message;
  return '';
};

const flattenTerminalOutput = (output) => {
  if (Array.isArray(output)) {
    return output.map(toTerminalText).join('');
  }
  if (typeof output === 'string') {
    return output;
  }
  return '';
};

export default function useTowerDefenseV2TerminalState() {
  const terminalRef = useRef(null);
  const chatPanelRef = useRef(null);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalResetKey, setTerminalResetKey] = useState(0);

  const addTerminalMessage = useCallback((text, _type = 'system') => {
    const normalizeMessage = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              if (typeof item.text === 'string') return item.text;
              if (typeof item.message === 'string') return item.message;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n');
      }
      if (value && typeof value === 'object') {
        if (typeof value.text === 'string') return value.text;
        if (typeof value.message === 'string') return value.message;
        try {
          return JSON.stringify(value);
        } catch {
          return '';
        }
      }
      return String(value ?? '');
    };

    const messageText = normalizeMessage(text);
    if (!messageText) return;

    setTerminalOutput((prev) => {
      const previousText = flattenTerminalOutput(prev);
      const newline = previousText ? '\n' : '';
      return `${previousText}${newline}${messageText}`;
    });
  }, []);

  const normalizeTerminalOutput = useCallback(
    (output) => normalizeTerminalOutputHelper(output),
    []
  );

  const clearChatHistory = useCallback(() => {
    if (chatPanelRef.current?.clearChatHistory) {
      return chatPanelRef.current.clearChatHistory();
    }
    return false;
  }, []);

  return {
    terminalRef,
    chatPanelRef,
    terminalOutput,
    setTerminalOutput,
    terminalResetKey,
    setTerminalResetKey,
    addTerminalMessage,
    normalizeTerminalOutput,
    clearChatHistory,
  };
}
