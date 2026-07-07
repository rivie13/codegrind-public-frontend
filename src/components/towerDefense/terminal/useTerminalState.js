import { useBreakpointValue } from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import visualSettingsManager from '../../../utils/game/VisualSettingsManager';
import { useAuth } from '../../../contexts/AuthContext';
import useCommandHistory from './hooks/useCommandHistory';
import useEscapeCancel from './hooks/useEscapeCancel';
import useResizableTerminal from './hooks/useResizableTerminal';
import { COMMAND_HISTORY_KEY, MAX_COMMAND_HISTORY } from './TerminalCommands';

const useTerminalState = ({
  executionResult,
  isLoading = false,
  showAd = false,
  adSlotId = '9351579126',
  terminalHeight = '100%',
  livesRemaining = 10,
  onNewMessageProcessed = () => {},
  isResizable = true,
  gameStatus = '',
  onCommandSubmit = null,
  inputEnabled = false,
  inputPlaceholder = 'Type /tower help',
  inputDisabledReason = 'Commands are locked during active waves.',
  isPlacementActive = false,
  onCancelPlacement = null,
}) => {
  const auth = useAuth();
  const user = auth?.user;
  const [showCursor, setShowCursor] = useState(true);
  const terminalContentRef = useRef(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(10);
  const lastResultRef = useRef('');
  const messageQueueRef = useRef([]);
  const processingMessageRef = useRef(false);
  const currentTypingMessageRef = useRef(null);

  const toTerminalString = (value) => (typeof value === 'string' ? value : '');
  const appendTerminalLine = (value, line = '') => {
    if (Array.isArray(value)) return value;
    const current = toTerminalString(value);
    return `${current}${current.length > 0 ? '\n' : ''}${line}`;
  };

  const gameOverRef = useRef(false);
  const lastMessageProcessedRef = useRef(false);
  const receivedFinalMessagesRef = useRef(false);
  const userScrolledAwayRef = useRef(false);
  const lastScrollPositionRef = useRef({ top: 0, height: 0, scrollHeight: 0 });
  const lastLoggedStateRef = useRef({
    gameOver: false,
    livesRemaining: 10,
    gameStatus: '',
    glitchClass: '',
  });

  const shouldShowAd = useMemo(() => {
    if (!showAd) return false;
    const storedTier =
      typeof window !== 'undefined' ? localStorage.getItem('membership_tier') : null;
    const rawTier = (user?.membershipTier || storedTier || 'FREE').toUpperCase();
    const normalizedTier = rawTier === 'PRO' ? 'PREMIUM' : rawTier;
    const isAdFree = normalizedTier.includes('PREMIUM') || normalizedTier.includes('UNLIMITED');
    return !isAdFree;
  }, [showAd, user?.membershipTier]);

  const [visualSettings, setVisualSettings] = useState(visualSettingsManager.getSettings());

  const terminalRef = useRef(null);

  const { initialHeight, handleResizeStart, terminalContainerRef } = useResizableTerminal({
    isResizable,
    defaultHeight: 300,
    terminalContentRef,
  });

  const { commandInput, handleInputChange, handleKeyDown } = useCommandHistory({
    storageKey: COMMAND_HISTORY_KEY,
    maxHistory: MAX_COMMAND_HISTORY,
    onCommandSubmit,
    inputEnabled,
    isPlacementActive,
    onCancelPlacement,
  });

  useEscapeCancel({ isActive: isPlacementActive, onCancelPlacement });

  const scrollToBottom = (force = false) => {
    if (!terminalRef.current) return;

    if (!visualSettings.terminalForceScroll && !force) return;

    if (userScrolledAwayRef.current && !force) {
      if (
        visualSettings.terminalScrollFrequency === 'batch' &&
        messageQueueRef.current.length === 0 &&
        !processingMessageRef.current
      ) {
        // Allow batch scroll
      } else {
        return;
      }
    }

    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  };

  const handleMessageProcessed = () => {
    if (visualSettings.terminalForceScroll) {
      requestAnimationFrame(() => {
        if (
          visualSettings.terminalScrollFrequency === 'every' ||
          (visualSettings.terminalScrollFrequency === 'batch' &&
            messageQueueRef.current.length === 0)
        ) {
          scrollToBottom(true);
        }
      });
    }

    onNewMessageProcessed();
  };

  const processNextMessage = () => {
    if (Array.isArray(displayedText)) {
      setIsTyping(false);
      processingMessageRef.current = false;
      messageQueueRef.current = [];
      currentTypingMessageRef.current = null;
      return;
    }

    const isDisplayingVictoryContent =
      Array.isArray(displayedText) &&
      displayedText.length > 0 &&
      displayedText.some(
        (item) =>
          (typeof item === 'string' && item.includes('[SUCCESS]')) ||
          (typeof item === 'object' && item.text && item.text.includes('[SUCCESS]'))
      );

    if (
      !isDisplayingVictoryContent &&
      (window._victoryScreenDisplayed === true ||
        window._gameEventsLocked === true ||
        document.body.classList.contains('victory-screen-displayed'))
    ) {
      messageQueueRef.current = [];
      processingMessageRef.current = false;
      currentTypingMessageRef.current = null;
      setIsTyping(false);
      return;
    }

    if (
      !isDisplayingVictoryContent &&
      terminalRef.current &&
      (terminalRef.current._victoryDisplayed ||
        terminalRef.current.hasAttribute('data-victory-displayed'))
    ) {
      messageQueueRef.current = [];
      processingMessageRef.current = false;
      currentTypingMessageRef.current = null;
      setIsTyping(false);
      return;
    }

    if (processingMessageRef.current || messageQueueRef.current.length === 0) {
      if (
        !processingMessageRef.current &&
        messageQueueRef.current.length === 0 &&
        receivedFinalMessagesRef.current &&
        !lastMessageProcessedRef.current
      ) {
        lastMessageProcessedRef.current = true;
      }
      return;
    }

    processingMessageRef.current = true;

    if (messageQueueRef.current.length > 20) {
      const batchSize = Math.min(10, messageQueueRef.current.length);

      const securityMessages = messageQueueRef.current
        .slice(0, batchSize)
        .filter((msg) => msg.includes('[SECURITY]') && msg.includes('deployed'));

      if (securityMessages.length > 3) {
        const summary = `[SECURITY] Multiple security daemons deployed (x${securityMessages.length}). Intrusion countermeasures activated.`;

        const indexesToRemove = [];
        for (let i = 0; i < batchSize; i++) {
          if (
            messageQueueRef.current[i].includes('[SECURITY]') &&
            messageQueueRef.current[i].includes('deployed')
          ) {
            indexesToRemove.push(i);
          }
        }

        for (let i = indexesToRemove.length - 1; i >= 0; i--) {
          messageQueueRef.current.splice(indexesToRemove[i], 1);
        }

        messageQueueRef.current.unshift(summary);

        if (messageQueueRef.current.length > 50) {
          setDisplayedText((prev) => appendTerminalLine(prev, summary));
          processingMessageRef.current = false;
          messageQueueRef.current.shift();
          currentTypingMessageRef.current = null;

          setTimeout(processNextMessage, 0);
          return;
        }
      }

      setIsTyping(true);
      setTypingSpeed(0.1);
      setDisplayedText((prev) => appendTerminalLine(prev, ''));
      currentTypingMessageRef.current = messageQueueRef.current[0] || null;
      return;
    }

    if (messageQueueRef.current.length > 10) {
      const batchSize = Math.min(5, messageQueueRef.current.length);
      const messagesInBatch = messageQueueRef.current.slice(0, batchSize);
      const allSecurity = messagesInBatch.every(
        (msg) => msg.includes('[SECURITY]') && msg.includes('deployed')
      );

      if (allSecurity && batchSize > 1) {
        const summary = `[SECURITY] Multiple security daemons deployed (x${batchSize}). Intrusion countermeasures activated.`;

        setIsTyping(true);
        setTypingSpeed(0.5);
        setDisplayedText((prev) => appendTerminalLine(prev, ''));
        messageQueueRef.current[0] = summary;
        currentTypingMessageRef.current = summary;

        messageQueueRef.current.splice(1, batchSize - 1);
        return;
      }
    }

    const nextMessage = messageQueueRef.current[0];
    currentTypingMessageRef.current = nextMessage;

    setIsTyping(true);

    if (messageQueueRef.current.length > 15) {
      setTypingSpeed(0.2);
    } else if (
      (nextMessage.includes('Wave') && nextMessage.includes('initiated')) ||
      (nextMessage.includes('[SECURITY]') && nextMessage.includes('deployed'))
    ) {
      setTypingSpeed(0.5);
    } else if (
      nextMessage.includes('██') ||
      nextMessage.includes('[VERIFY]') ||
      nextMessage.includes('[CRITICAL]') ||
      nextMessage.includes('[ALERT]')
    ) {
      setTypingSpeed(0.5);
    } else if (nextMessage.includes('[SECURITY]') || nextMessage.includes('[BREACH]')) {
      setTypingSpeed(0.5);
    } else {
      setTypingSpeed(1);
    }

    setDisplayedText((prev) => appendTerminalLine(prev, ''));

    if (visualSettings.terminalForceScroll && visualSettings.terminalScrollFrequency === 'every') {
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
  };

  useEffect(() => {
    const isOver =
      gameStatus === 'gameover' || gameStatus === 'game-over' || gameStatus === 'level-complete';

    if (isOver !== gameOverRef.current || gameStatus !== lastLoggedStateRef.current.gameStatus) {
      lastLoggedStateRef.current.gameStatus = gameStatus;
      lastLoggedStateRef.current.gameOver = isOver;
    }

    gameOverRef.current = isOver;

    if (isOver) {
      receivedFinalMessagesRef.current = true;
      lastMessageProcessedRef.current = true;
    }
  }, [gameStatus]);

  useEffect(() => {
    if (livesRemaining !== lastLoggedStateRef.current.livesRemaining) {
      lastLoggedStateRef.current.livesRemaining = livesRemaining;

      if (livesRemaining === 0 && !gameOverRef.current) {
        gameOverRef.current = true;
      }
    }
  }, [livesRemaining]);

  const isSmallScreen = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const hasVictoryContent =
      Array.isArray(executionResult) &&
      executionResult.length > 0 &&
      executionResult.some(
        (item) =>
          (typeof item === 'string' && item.includes('[SUCCESS]')) ||
          (typeof item === 'object' && item.text && item.text.includes('[SUCCESS]'))
      );

    if (
      !hasVictoryContent &&
      (window._victoryScreenDisplayed === true ||
        window._gameEventsLocked === true ||
        document.body.classList.contains('victory-screen-displayed'))
    ) {
      return;
    }

    if (
      !hasVictoryContent &&
      terminalRef.current &&
      (terminalRef.current._victoryDisplayed ||
        terminalRef.current.hasAttribute('data-victory-displayed'))
    ) {
      return;
    }

    if (
      (executionResult === null || executionResult === '') &&
      !isLoading &&
      !gameOverRef.current
    ) {
      setDisplayedText('');
      messageQueueRef.current = [];
      lastResultRef.current = '';
      setIsTyping(false);
      processingMessageRef.current = false;
      return;
    }

    if (executionResult && executionResult !== lastResultRef.current) {
      if (Array.isArray(executionResult)) {
        setDisplayedText(executionResult);
        setIsTyping(false);
        processingMessageRef.current = false;
        messageQueueRef.current = [];

        if (terminalRef.current) {
          terminalRef.current._victoryDisplayed = true;
          terminalRef.current.setAttribute('data-victory-displayed', 'true');
          terminalRef.current._victoryScreenContent = executionResult;
        }

        lastResultRef.current = executionResult;
        return;
      }

      let newMessages = [];
      if (typeof executionResult === 'string') {
        const allLines = executionResult.split('\n').map((msg) => DOMPurify.sanitize(msg));
        const prevLines =
          typeof lastResultRef.current === 'string' ? lastResultRef.current.split('\n').length : 0;
        const newLines = allLines.slice(prevLines);
        newMessages = newLines;
      }

      newMessages = newMessages.filter((msg) => msg && msg.trim() !== '');

      if (newMessages.length > 0) {
        messageQueueRef.current.push(...newMessages);
        if (!isTyping && !processingMessageRef.current) {
          processNextMessage();
        }
      }
      lastResultRef.current = executionResult;
    }
  }, [executionResult, isLoading]);

  useEffect(() => {
    const handleVictoryScreenStarting = () => {
      setIsTyping(false);
      processingMessageRef.current = false;
      messageQueueRef.current = [];

      if (terminalRef.current) {
        terminalRef.current._victoryDisplayed = true;
        terminalRef.current.setAttribute('data-victory-displayed', 'true');
      }

      window._gameEventsLocked = true;
      window._victoryScreenDisplayed = true;
      document.body.classList.add('victory-screen-displayed');
    };

    const handleComponentUnmounting = () => {
      setIsTyping(false);
      processingMessageRef.current = false;
      messageQueueRef.current = [];
      setDisplayedText('');
      lastResultRef.current = '';

      if (terminalRef.current) {
        terminalRef.current._victoryDisplayed = false;
        terminalRef.current.removeAttribute('data-victory-displayed');

        delete terminalRef.current._victoryScreenContent;
        delete terminalRef.current._victoryRetryCount;

        if (terminalRef.current.messageQueueRef) {
          terminalRef.current.messageQueueRef.current = [];
        }
        if (terminalRef.current.processingMessageRef) {
          terminalRef.current.processingMessageRef.current = false;
        }
      }
    };

    document.addEventListener('victory-screen-starting', handleVictoryScreenStarting);
    document.addEventListener('tower-defense-component-unmounting', handleComponentUnmounting);

    return () => {
      document.removeEventListener('victory-screen-starting', handleVictoryScreenStarting);
      document.removeEventListener('tower-defense-component-unmounting', handleComponentUnmounting);
    };
  }, []);

  useEffect(() => {
    const handleSettingsChange = () => {
      const newSettings = visualSettingsManager.getSettings();
      setVisualSettings(newSettings);

      if (
        newSettings.terminalTypingEnabled === false &&
        isTyping &&
        messageQueueRef.current.length > 0
      ) {
        const currentMessage = messageQueueRef.current[0];

        setDisplayedText((prev) => {
          if (Array.isArray(prev)) {
            return prev;
          }
          const lastNewlineIndex = prev.lastIndexOf('\n');
          if (lastNewlineIndex === -1) {
            return currentMessage;
          }
          return prev.substring(0, lastNewlineIndex + 1) + currentMessage;
        });

        setIsTyping(false);
        messageQueueRef.current.shift();
        processingMessageRef.current = false;
        handleMessageProcessed();

        setTimeout(processNextMessage, 10);
      }
    };

    window.addEventListener('td-settings-changed', handleSettingsChange);

    return () => {
      window.removeEventListener('td-settings-changed', handleSettingsChange);
    };
  }, [isTyping, handleMessageProcessed]);

  useEffect(() => {
    if (Array.isArray(displayedText)) {
      if (isTyping) {
        setIsTyping(false);
      }
      processingMessageRef.current = false;
      messageQueueRef.current = [];
      currentTypingMessageRef.current = null;
      return () => {};
    }

    const isDisplayingVictoryContent =
      Array.isArray(displayedText) &&
      displayedText.length > 0 &&
      displayedText.some(
        (item) =>
          (typeof item === 'string' && item.includes('[SUCCESS]')) ||
          (typeof item === 'object' && item.text && item.text.includes('[SUCCESS]'))
      );

    if (
      !isDisplayingVictoryContent &&
      (window._victoryScreenDisplayed === true ||
        window._gameEventsLocked === true ||
        document.body.classList.contains('victory-screen-displayed'))
    ) {
      setIsTyping(false);
      processingMessageRef.current = false;
      messageQueueRef.current = [];
      currentTypingMessageRef.current = null;
      return;
    }

    if (
      !isDisplayingVictoryContent &&
      terminalRef.current &&
      (terminalRef.current._victoryDisplayed ||
        terminalRef.current.hasAttribute('data-victory-displayed'))
    ) {
      setIsTyping(false);
      processingMessageRef.current = false;
      messageQueueRef.current = [];
      currentTypingMessageRef.current = null;
      return;
    }

    let typingTimer;

    if (
      visualSettings.terminalTypingEnabled === false &&
      isTyping &&
      messageQueueRef.current.length > 0
    ) {
      const currentMessage = currentTypingMessageRef.current || messageQueueRef.current[0];
      currentTypingMessageRef.current = currentMessage;

      setDisplayedText((prev) => {
        if (Array.isArray(prev)) {
          return prev;
        }
        const lastNewlineIndex = prev.lastIndexOf('\n');
        if (lastNewlineIndex === -1) {
          return currentMessage;
        }
        return prev.substring(0, lastNewlineIndex + 1) + currentMessage;
      });

      setIsTyping(false);
      messageQueueRef.current.shift();
      processingMessageRef.current = false;
      currentTypingMessageRef.current = null;
      handleMessageProcessed();

      setTimeout(processNextMessage, 0);
      return () => {};
    }

    if (isTyping && messageQueueRef.current.length > 0) {
      const currentMessage = currentTypingMessageRef.current || messageQueueRef.current[0];
      currentTypingMessageRef.current = currentMessage;
      const currentlyTypedChars = displayedText.split('\n').pop() || '';

      const normalDelay = 8;
      const fastDelay = 2;

      const speedRange = 1.5 - 0.4;
      const normalized = (visualSettings.terminalTypingSpeed - 0.4) / speedRange;
      const baseTypingDelay = normalDelay - normalized * (normalDelay - fastDelay);

      const settingsBasedTypingSpeed = visualSettings.terminalTypingEnabled ? baseTypingDelay : 0.1;

      const queueBasedTypingSpeed =
        messageQueueRef.current.length > 30
          ? 1
          : messageQueueRef.current.length > 10
            ? 1.5
            : messageQueueRef.current.length > 5
              ? Math.min(3, settingsBasedTypingSpeed / 2)
              : settingsBasedTypingSpeed;

      if (currentlyTypedChars.length < currentMessage.length) {
        typingTimer = setTimeout(() => {
          const charsPerFrame = Math.max(
            4,
            visualSettings.terminalTypingSpeed < 0.8
              ? Math.ceil(visualSettings.terminalTypingSpeed * 10)
              : visualSettings.terminalTypingSpeed < 1.2
                ? Math.ceil(visualSettings.terminalTypingSpeed * 14)
                : Math.ceil(visualSettings.terminalTypingSpeed * 20)
          );

          const charsToAddMultiplier = !visualSettings.terminalTypingEnabled
            ? 100
            : messageQueueRef.current.length > 30
              ? 12
              : messageQueueRef.current.length > 15
                ? 6
                : messageQueueRef.current.length > 5
                  ? 3
                  : 1;

          const charsToAdd = Math.max(1, charsPerFrame * charsToAddMultiplier);
          const startPos = currentlyTypedChars.length;
          const endPos = Math.min(startPos + charsToAdd, currentMessage.length);
          const newChars = currentMessage.substring(startPos, endPos);

          setDisplayedText((prev) => {
            if (Array.isArray(prev)) {
              return prev;
            }
            const current = toTerminalString(prev);
            const lastNewlineIndex = current.lastIndexOf('\n');
            if (lastNewlineIndex === -1) {
              return current + newChars;
            }
            return (
              current.substring(0, lastNewlineIndex + 1) +
              current.substring(lastNewlineIndex + 1) +
              newChars
            );
          });

          if (
            visualSettings.terminalForceScroll &&
            visualSettings.terminalScrollFrequency === 'every' &&
            endPos === currentMessage.length
          ) {
            requestAnimationFrame(() => scrollToBottom());
          }
        }, queueBasedTypingSpeed);
      } else {
        setIsTyping(false);

        messageQueueRef.current.shift();

        processingMessageRef.current = false;
        currentTypingMessageRef.current = null;

        handleMessageProcessed();

        if (
          messageQueueRef.current.length === 0 &&
          receivedFinalMessagesRef.current &&
          !lastMessageProcessedRef.current
        ) {
          lastMessageProcessedRef.current = true;
        }

        const minDelay = 5;
        const maxDelay = 50;
        const normalizedDelay = (visualSettings.terminalTypingSpeed - 0.4) / (1.5 - 0.4);
        const baseDelay = maxDelay - normalizedDelay * (maxDelay - minDelay);

        const nextDelay = !visualSettings.terminalTypingEnabled
          ? 0
          : messageQueueRef.current.length > 30
            ? 0
            : messageQueueRef.current.length > 15
              ? 1
              : messageQueueRef.current.length > 5
                ? Math.min(5, baseDelay / 4)
                : baseDelay;

        setTimeout(() => processNextMessage(), nextDelay);
      }
    }

    return () => {
      if (typingTimer) clearTimeout(typingTimer);
    };
  }, [displayedText, isTyping, typingSpeed, visualSettings]);

  useEffect(() => {
    if (!displayedText && executionResult) {
      setDisplayedText(executionResult);
      lastResultRef.current = executionResult;
    }
  }, [displayedText, executionResult]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 600);

    return () => clearInterval(cursorInterval);
  }, []);

  const lastScrollTimeRef = useRef(0);
  useEffect(() => {
    if (terminalContentRef.current) {
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 50) {
        terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
        lastScrollTimeRef.current = now;
      }
    }
  }, [displayedText]);

  useEffect(() => {
    const newSettings = visualSettingsManager.getSettings();
    setVisualSettings(newSettings);
  }, [executionResult]);

  useEffect(() => {
    const newSettings = visualSettingsManager.getSettings();
    setVisualSettings(newSettings);
  }, [isLoading]);

  const getTerminalGlitchClass = () => {
    if (
      (gameOverRef.current && lastMessageProcessedRef.current) ||
      (gameStatus &&
        (gameStatus === 'game-over' ||
          gameStatus === 'gameover' ||
          gameStatus === 'level-complete'))
    ) {
      return 'terminal-no-glitch';
    }

    if (visualSettings.terminalGlitchEnabled === false) {
      return 'terminal-no-glitch';
    }

    const intensity = visualSettings.terminalGlitchIntensity;

    if (intensity <= 0.2) {
      return 'terminal-no-glitch';
    }

    if (terminalRef.current) {
      const intensityScale = Math.max(0.4, intensity);
      terminalRef.current.style.setProperty('--glitch-intensity', intensityScale);
      terminalRef.current.style.setProperty('--text-shadow-strength', `${intensityScale * 0.1}em`);
      terminalRef.current.style.setProperty('--transform-strength', `${intensityScale * 0.05}em`);
      terminalRef.current.style.setProperty('--animation-speed', `${2 / intensityScale}s`);

      const shakeSpeed = Math.max(0.3, 0.8 / (intensityScale * 1.2));
      terminalRef.current.style.setProperty('--shake-animation-speed', `${shakeSpeed}s`);

      const shakeAmount = Math.pow(intensityScale, 1.5) * 6;
      terminalRef.current.style.setProperty('--shake-intensity', `${shakeAmount}px`);
    }

    if (livesRemaining <= 3) {
      return 'terminal-glitch-high';
    }
    if (livesRemaining <= 5) {
      return 'terminal-glitch-medium';
    }
    if (livesRemaining <= 7) {
      return 'terminal-glitch-low';
    }

    return '';
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!terminalRef.current) return;

      const { scrollTop, clientHeight, scrollHeight } = terminalRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30;

      userScrolledAwayRef.current = !isAtBottom;

      lastScrollPositionRef.current = {
        top: scrollTop,
        height: clientHeight,
        scrollHeight: scrollHeight,
      };
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener('scroll', handleScroll);
      return () => terminal.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    if (visualSettings.terminalForceScroll) {
      const scrollFrequency = visualSettings.terminalScrollFrequency;

      if (scrollFrequency === 'every') {
        scrollToBottom();
      } else if (scrollFrequency === 'batch') {
        if (!isTyping && messageQueueRef.current.length === 0) {
          scrollToBottom(true);
        }
      }
    }
  }, [
    displayedText,
    visualSettings.terminalForceScroll,
    visualSettings.terminalScrollFrequency,
    isTyping,
  ]);

  return {
    shouldShowAd,
    showCursor,
    terminalRef,
    terminalContentRef,
    terminalContainerRef,
    initialHeight,
    handleResizeStart,
    commandInput,
    handleInputChange,
    handleKeyDown,
    displayedText,
    isSmallScreen,
    getTerminalGlitchClass,
    isLoading,
    adSlotId,
    inputEnabled,
    inputPlaceholder,
    inputDisabledReason,
    terminalHeight,
    isResizable,
  };
};

export default useTerminalState;
