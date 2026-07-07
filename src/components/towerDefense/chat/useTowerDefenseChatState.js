import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';
import { prepareForPrompt } from '../../../utils/code/promptInjectionPrevention';
import { buildTowerDefenseChatContext } from '../../chat/chatContext';
import {
  filterDuplicateLimitMessages,
  formatCooldown,
  generateUniqueId,
  getResetRemainingSeconds,
  normalizeProblemId,
  sanitizeOutgoingMessage,
} from '../../chat/chatHelpers';

const FONT_PREF_KEY = 'chatFontPreference';
const CHAT_USAGE_CACHE_KEY_PREFIX = 'tower_defense_chat_usage';

const CHAT_LIMITS = {
  FREE: 10,
  PREMIUM: 30,
  UNLIMITED: Infinity,
};

const chatAdOptions = {
  short: { credits: 3, label: 'Short (+3)' },
  long: { credits: 5, label: 'Long (+5)' },
  full: { credits: 10, label: 'Full (+10)' },
};

const getChatHistoryKey = (problemId, userId) => {
  return `tower_defense_chat_${problemId}_${userId}`;
};

const getChatUsageCacheKey = (problemId, userId) => {
  return `${CHAT_USAGE_CACHE_KEY_PREFIX}_${problemId}_${userId}`;
};

const readCachedChatUsage = (problemId, userId) => {
  if (!problemId) {
    return null;
  }

  try {
    const key = getChatUsageCacheKey(normalizeProblemId(problemId), userId);
    const cachedValue = sessionStorage.getItem(key);
    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch {
    return null;
  }
};

const writeCachedChatUsage = (problemId, userId, usage) => {
  if (!problemId || !usage) {
    return;
  }

  try {
    const key = getChatUsageCacheKey(normalizeProblemId(problemId), userId);
    sessionStorage.setItem(key, JSON.stringify(usage));
  } catch {
    // Ignore storage errors.
  }
};

const serializeMessages = (messages) => {
  return messages.map((msg) => {
    if (msg.isLimit) {
      return {
        ...msg,
        content: {
          type: 'LIMIT_MESSAGE',
          originalContent: typeof msg.content === 'string' ? msg.content : null,
        },
      };
    }
    return msg;
  });
};

const deserializeMessages = (messages) => {
  return messages.map((msg) => {
    if (msg.content && typeof msg.content === 'object' && msg.content.type === 'LIMIT_MESSAGE') {
      return {
        ...msg,
        isLimit: true,
      };
    }
    return msg;
  });
};

const useTowerDefenseChatState = ({
  problemId,
  onInputStart,
  shouldLoadUsage = true,
  assistanceLevel,
  problem,
  problemDescription,
  language,
  code,
  terminalOutput,
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const actorId = user?.id || 'guest';
  const rawMembershipTier = (
    user?.membershipTier ||
    localStorage.getItem('membership_tier') ||
    'FREE'
  ).toUpperCase();
  const membershipTier = rawMembershipTier === 'PRO' ? 'PREMIUM' : rawMembershipTier;
  const isUnlimited = membershipTier === 'UNLIMITED';
  const canShowRewardAds = !isUnlimited;

  const defaultMessage = useMemo(
    () => ({
      content: "Greetings. I'm your neural assistant. How can I help with this challenge today?",
      isAi: true,
      id: 'intro',
    }),
    []
  );

  const [input, setInput] = useState('');
  const [readableFont, setReadableFont] = useState(() => {
    try {
      return localStorage.getItem(FONT_PREF_KEY) === 'readable';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [dailyRemaining, setDailyRemaining] = useState(null);
  const [totalAllowed, setTotalAllowed] = useState(null);
  const [hasLoadedUsage, setHasLoadedUsage] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [extraCredits, setExtraCredits] = useState(0);
  const [lastResetTime, setLastResetTime] = useState(null);
  const [limitMessageShown, setLimitMessageShown] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adViewed, setAdViewed] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState('short');
  const [adCooldownUntil, setAdCooldownUntil] = useState(null);
  const [adCooldownRemaining, setAdCooldownRemaining] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const selectedModelRef = useRef(null);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  const getSavedMessages = useCallback(() => {
    if (!problemId) {
      return [defaultMessage];
    }

    try {
      const normalizedId = normalizeProblemId(problemId);
      const key = getChatHistoryKey(normalizedId, actorId);
      const savedMessages = localStorage.getItem(key);

      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        const deserializedMessages = deserializeMessages(parsedMessages);
        return deserializedMessages.filter((msg) => !msg.isLimit);
      }
    } catch (error) {
      logger.error('Error retrieving saved chat messages:');
      logger.debug(error.stack);
    }

    return [defaultMessage];
  }, [actorId, defaultMessage, problemId]);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_PREF_KEY, readableFont ? 'readable' : 'mono');
    } catch {
      // Ignore storage errors
    }
  }, [readableFont]);

  const [messages, setMessages] = useState(() => {
    if (problemId) {
      return getSavedMessages();
    }
    return [defaultMessage];
  });

  const removeLimitMessages = useCallback(() => {
    setMessages((prev) => prev.filter((msg) => !msg.isLimit));
  }, []);

  const addLimitMessage = useCallback(() => {
    if (!limitMessageShown) {
      const limitId = generateUniqueId();
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            content: {
              type: 'LIMIT_MESSAGE',
            },
            isAi: true,
            isLimit: true,
            id: limitId,
          },
        ];

        return filterDuplicateLimitMessages(newMessages);
      });
      setLimitMessageShown(true);
    }
  }, [limitMessageShown]);

  const resetUsageState = useCallback(() => {
    setChatCount(0);
    setDailyRemaining(null);
    setTotalAllowed(null);
    setHasLoadedUsage(false);
    setIsDisabled(true);
    setExtraCredits(0);
    setLastResetTime(null);
    setLimitMessageShown(false);
    setAdCooldownUntil(null);
    setAdCooldownRemaining(0);
    removeLimitMessages();
  }, [removeLimitMessages]);

  const applyUsageSnapshot = useCallback(
    (usage) => {
      if (!usage || typeof usage !== 'object') {
        return false;
      }

      const lastReset = usage.lastResetTime ? new Date(usage.lastResetTime) : null;
      const remaining = usage.dailyRemaining ?? usage.remaining ?? null;
      const hasReachedLimit = typeof remaining === 'number' && remaining <= 0;

      setChatCount(usage.chatCount || 0);
      setExtraCredits(usage.extraCredits || 0);
      setLastResetTime(lastReset);
      setDailyRemaining(remaining);
      setTotalAllowed(usage.totalAllowed ?? null);
      setAdCooldownUntil(usage.chatAdCooldownUntil ?? null);
      setAdCooldownRemaining(usage.chatAdCooldownRemaining ?? 0);

      if (hasReachedLimit) {
        setIsDisabled(true);
        setInput('');

        if (!limitMessageShown) {
          addLimitMessage();
        }
      } else {
        setIsDisabled(false);
        setLimitMessageShown(false);
        removeLimitMessages();
      }

      return true;
    },
    [addLimitMessage, limitMessageShown, removeLimitMessages]
  );

  useEffect(() => {
    if (problemId) {
      const loadedMessages = getSavedMessages();
      setMessages(loadedMessages);
    }
  }, [problemId, actorId, getSavedMessages]);

  useEffect(() => {
    if (!problemId) {
      resetUsageState();
      return;
    }

    const cachedUsage = readCachedChatUsage(problemId, actorId);
    if (cachedUsage) {
      applyUsageSnapshot(cachedUsage);
      setHasLoadedUsage(true);
      return;
    }

    resetUsageState();
  }, [actorId, applyUsageSnapshot, problemId, resetUsageState]);

  useEffect(() => {
    if (problemId && messages.length > 0) {
      try {
        const normalizedId = normalizeProblemId(problemId);
        const key = getChatHistoryKey(normalizedId, actorId);
        const serializedMessages = serializeMessages(messages);
        localStorage.setItem(key, JSON.stringify(serializedMessages));
      } catch (error) {
        logger.error('Error saving chat messages:');
        logger.debug(error.stack);
      }
    }
  }, [messages, problemId, actorId]);

  const showChatUnavailableToast = useCallback(() => {
    if (typeof toast.isActive === 'function' && toast.isActive('td-chat-unavailable')) {
      return;
    }

    toast({
      id: 'td-chat-unavailable',
      title: 'Chat unavailable',
      description: 'We could not load neural chat right now. Please try again.',
      status: 'warning',
      duration: 3500,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  const fetchChatUsage = useCallback(async () => {
    try {
      const normalizedId = normalizeProblemId(problemId);

      const data = await api.chat.getUsage(actorId, normalizedId);
      logger.info('Received chat usage data:');
      logger.debug(data);

      writeCachedChatUsage(problemId, actorId, data);
      applyUsageSnapshot(data);
    } catch (error) {
      logger.error('Error fetching chat usage:');
      logger.debug(error.stack);
      setIsDisabled(true);
      showChatUnavailableToast();
    } finally {
      setHasLoadedUsage(true);
    }
  }, [actorId, applyUsageSnapshot, problemId, showChatUnavailableToast]);

  useEffect(() => {
    if (!problemId || !shouldLoadUsage) {
      return;
    }

    const cachedUsage = readCachedChatUsage(problemId, actorId);
    if (cachedUsage) {
      setHasLoadedUsage(true);
      return;
    }

    setHasLoadedUsage(false);
    setIsDisabled(true);
    fetchChatUsage();
  }, [actorId, fetchChatUsage, problemId, shouldLoadUsage]);

  const handleWatchAd = useCallback(
    async (adType = 'short') => {
      if (!canShowRewardAds) {
        return;
      }
      try {
        setSelectedAdType(adType);
        const normalizedId = normalizeProblemId(problemId);
        const data = await api.chat.getUsage(actorId, normalizedId);
        setAdCooldownUntil(data.chatAdCooldownUntil ?? null);
        setAdCooldownRemaining(data.chatAdCooldownRemaining ?? 0);

        if ((data.chatAdCooldownRemaining ?? 0) > 0) {
          setMessages((prev) => [
            ...prev,
            {
              content: `Ad cooldown active. Please wait ${formatCooldown(data.chatAdCooldownRemaining)} before watching another ad.`,
              isWarning: true,
              id: generateUniqueId(),
            },
          ]);
          return;
        }

        setShowAd(true);

        setTimeout(() => {
          setAdViewed(true);
        }, 5000);
      } catch (error) {
        logger.error('Error watching ad:');
        logger.debug(error.stack);
      }
    },
    [actorId, canShowRewardAds, problemId]
  );

  const handleAdComplete = useCallback(async () => {
    try {
      setShowAd(false);
      setAdViewed(false);

      const normalizedId = normalizeProblemId(problemId);
      const data = await api.chat.addCredit(actorId, normalizedId, selectedAdType);
      setExtraCredits(data.extraCredits);
      setIsDisabled(false);
      setLastResetTime(new Date());

      setMessages((prev) => [
        ...prev,
        {
          content: `Bandwidth upgraded! +${chatAdOptions[selectedAdType].credits} daily credits added. Note: Additional bandwidth expires in 24 hours if unused.`,
          isWarning: true,
          id: generateUniqueId(),
        },
      ]);

      await fetchChatUsage();
    } catch (error) {
      logger.error('Error processing ad completion:');
      logger.debug(error.stack);
      if (error?.status === 429 && error?.data) {
        const remaining = error.data.chatAdCooldownRemaining || 0;
        setMessages((prev) => [
          ...prev,
          {
            content:
              remaining > 0
                ? `Ad cooldown active. Please wait ${formatCooldown(remaining)} before watching another ad.`
                : error.data.message ||
                  'Ad cooldown active. Please wait before watching another ad.',
            isWarning: true,
            id: generateUniqueId(),
          },
        ]);
      }
    }
  }, [actorId, fetchChatUsage, problemId, selectedAdType]);

  const sendMessage = useCallback(
    async (inputValue) => {
      if (!inputValue.trim()) return;
      const messageId = generateUniqueId();
      const normalizedId = normalizeProblemId(problemId);
      try {
        setMessages((prev) => [
          ...prev,
          {
            content: inputValue,
            isAi: false,
            id: messageId,
          },
        ]);
        const thinkingId = `thinking-${messageId}`;
        setMessages((prev) => [
          ...prev,
          {
            content: null,
            isAi: true,
            isThinking: true,
            id: thinkingId,
          },
        ]);

        const preparedInput = prepareForPrompt(sanitizeOutgoingMessage(inputValue));

        const context = buildTowerDefenseChatContext({
          problemId,
          problem,
          problemDescription,
          language,
          code,
          terminalOutput,
          messages,
        });

        const response = await api.chat.sendMessage(
          actorId,
          normalizedId,
          preparedInput,
          assistanceLevel,
          context,
          selectedModelRef.current
        );
        logger.info('Chat response received:');
        setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId));

        let messageContent;
        if (response.response) {
          messageContent = response.response;
        } else if (response.message) {
          messageContent = response.message;
        } else if (response.content) {
          messageContent = {
            content: response.content,
            role: response.role || 'assistant',
            refusal: response.refusal,
          };
        } else if (typeof response === 'string') {
          messageContent = response;
        } else {
          messageContent = response;
        }
        setMessages((prev) => [
          ...prev,
          {
            content:
              typeof messageContent === 'object' && messageContent.content
                ? messageContent.content
                : typeof messageContent === 'string'
                  ? messageContent
                  : JSON.stringify(messageContent),
            isAi: true,
            role:
              typeof messageContent === 'object' ? messageContent.role || 'assistant' : 'assistant',
            refusal: typeof messageContent === 'object' ? messageContent.refusal : null,
            id: generateUniqueId(),
          },
        ]);

        await fetchChatUsage();
      } catch (error) {
        logger.error('Chat error:');
        logger.debug(error.stack);
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          'Neural interface error detected. Recalibration required.';
        const isFiltered =
          error?.data?.error === 'content_filter' ||
          (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('filtered'));

        if (isFiltered) {
          try {
            const retryInput = prepareForPrompt(sanitizeOutgoingMessage(inputValue));
            const retryResponse = await api.chat.sendMessage(
              actorId,
              normalizedId,
              retryInput,
              assistanceLevel,
              null,
              selectedModelRef.current
            );

            setMessages((prev) => prev.filter((msg) => msg.id !== `thinking-${messageId}`));
            setMessages((prev) => [
              ...prev,
              {
                content: 'I rephrased your request to avoid safety filters.',
                isAi: true,
                isWarning: true,
                id: generateUniqueId(),
              },
            ]);

            let retryContent;
            if (retryResponse.response) {
              retryContent = retryResponse.response;
            } else if (retryResponse.message) {
              retryContent = retryResponse.message;
            } else if (retryResponse.content) {
              retryContent = {
                content: retryResponse.content,
                role: retryResponse.role || 'assistant',
                refusal: retryResponse.refusal,
              };
            } else if (typeof retryResponse === 'string') {
              retryContent = retryResponse;
            } else {
              retryContent = retryResponse;
            }

            setMessages((prev) => [
              ...prev,
              {
                content:
                  typeof retryContent === 'object' && retryContent.content
                    ? retryContent.content
                    : typeof retryContent === 'string'
                      ? retryContent
                      : JSON.stringify(retryContent),
                isAi: true,
                role:
                  typeof retryContent === 'object' ? retryContent.role || 'assistant' : 'assistant',
                refusal: typeof retryContent === 'object' ? retryContent.refusal : null,
                id: generateUniqueId(),
              },
            ]);

            await fetchChatUsage();
            return;
          } catch (retryError) {
            logger.error('Chat retry error:');
            logger.debug(retryError.stack);
          }
        }

        setMessages((prev) => prev.filter((msg) => msg.id !== `thinking-${messageId}`));
        setMessages((prev) => [
          ...prev,
          {
            content: isFiltered
              ? 'Safety filters blocked this request. Try removing sensitive terms or summarize the issue.'
              : errorMessage,
            isAi: true,
            isError: true,
            id: generateUniqueId(),
          },
        ]);
        await fetchChatUsage();
      }
    },
    [
      actorId,
      assistanceLevel,
      code,
      fetchChatUsage,
      language,
      messages,
      problem,
      problemDescription,
      problemId,
      terminalOutput,
    ]
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isDisabled || isLoading) return;

    try {
      setIsLoading(true);

      const normalizedId = normalizeProblemId(problemId);
      const currentUsage = await api.chat.getUsage(actorId, normalizedId);

      const dailyLeft = currentUsage.dailyRemaining ?? currentUsage.remaining ?? Infinity;
      if (dailyLeft <= 0) {
        setIsDisabled(true);

        if (!limitMessageShown) {
          addLimitMessage();
        }

        setIsLoading(false);
        return;
      }

      await sendMessage(input);
      setInput('');

      await fetchChatUsage();
    } catch (error) {
      logger.error('Chat error:');
      logger.debug(error.stack);
      setMessages((prev) => [
        ...prev,
        {
          content: 'Neural interface error detected. Recalibration required.',
          isAi: true,
          isError: true,
          id: generateUniqueId(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  }, [
    actorId,
    addLimitMessage,
    fetchChatUsage,
    input,
    isDisabled,
    isLoading,
    limitMessageShown,
    problemId,
    sendMessage,
  ]);

  const handleInputChange = useCallback(
    (event) => {
      if (event.target.value && event.target.value.length === 1) {
        onInputStart?.();
      }
      setInput(event.target.value);
    },
    [onInputStart]
  );

  const handleUpgradeClick = useCallback(() => {
    setPendingPath('/upgrade');
    setShowLeaveModal(true);
  }, []);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveModal(false);
    setPendingPath(null);
  }, []);

  const handleLeaveConfirm = useCallback(() => {
    setShowLeaveModal(false);
    if (pendingPath) {
      navigate(pendingPath);
    }
    setPendingPath(null);
  }, [navigate, pendingPath]);

  useEffect(() => {
    setLimitMessageShown(false);
  }, [problemId]);

  const getExtraCreditExpiryTime = useCallback(() => {
    if (!lastResetTime || extraCredits <= 0) return null;

    const resetDate = new Date(lastResetTime);
    const expiryDate = new Date(resetDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeRemaining = expiryDate - now;

    if (timeRemaining <= 0) return 'Expired';

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, [extraCredits, lastResetTime]);

  const clearChatHistory = useCallback(() => {
    if (problemId) {
      try {
        const normalizedId = normalizeProblemId(problemId);
        const key = getChatHistoryKey(normalizedId, actorId);

        localStorage.removeItem(key);

        Object.keys(localStorage).forEach((storageKey) => {
          if (storageKey.startsWith('tower_defense_chat_')) {
            localStorage.removeItem(storageKey);
          }
        });

        setMessages([defaultMessage]);
        logger.info('Cleared chat history for problem:', normalizedId);
        return true;
      } catch (error) {
        logger.error('Error clearing chat history:');
        logger.debug(error.stack);
        return false;
      }
    }
    return false;
  }, [actorId, defaultMessage, problemId]);

  return {
    actorId,
    membershipTier,
    isUnlimited,
    canShowRewardAds,
    chatLimits: CHAT_LIMITS,
    chatAdOptions,
    input,
    readableFont,
    isLoading,
    chatCount,
    messages,
    dailyRemaining,
    totalAllowed,
    hasLoadedUsage,
    isDisabled,
    extraCredits,
    lastResetTime,
    adCooldownUntil,
    adCooldownRemaining,
    showAd,
    adViewed,
    selectedAdType,
    selectedModel,
    showLeaveModal,
    setReadableFont,
    setSelectedAdType,
    setSelectedModel,
    handleSend,
    handleInputChange,
    handleWatchAd,
    handleAdComplete,
    handleUpgradeClick,
    handleLeaveCancel,
    handleLeaveConfirm,
    getExtraCreditExpiryTime,
    getResetRemainingSeconds,
    formatCooldown,
    clearChatHistory,
  };
};

export default useTowerDefenseChatState;
