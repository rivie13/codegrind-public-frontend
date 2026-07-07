import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modalAdSlot } from '../../config/adSlots';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import '../../styles/Chat.css';
import { prepareForPrompt } from '../../utils/code/promptInjectionPrevention';
import ModelSelector from '../common/ModelSelector';
import {
  ChatAdActions,
  ChatShell,
  ChatStatusBar,
  Composer,
  LeaveModal,
  LimitMessage,
  MessageList,
  RewardAdModal,
  useChatState,
} from './index.js';
import { buildProblemChatContext } from './chatContext';
import {
  filterDuplicateLimitMessages,
  formatCooldown,
  generateUniqueId,
  getResetRemainingSeconds,
  normalizeProblemId,
  sanitizeOutgoingMessage,
} from './chatHelpers';

//import logger from utils
import logger from '../../utils/core/logger';
const FONT_PREF_KEY = 'chatFontPreference';

const Chat = ({
  problemId,
  onInputStart,
  assistanceLevel,
  problemData,
  code,
  executionResult,
  draftProblem,
  // Animation settings
  isHighRes,
  animationsEnabled = true,
  settings = {
    gridAnimation: { enabled: true, opacity: 0.2, speed: 30 },
    scanLineAnimation: { enabled: true, opacity: 0.5, speed: 5 },
    glitchEffects: { enabled: true, intensity: 1 },
    matrixEffects: { enabled: true, intensity: 1 },
  },
  quality = 'high',
  theme = 'retro-desktop',
}) => {
  const { messages, setMessages, input, setInput } = useChatState({
    initialMessages: [
      {
        content:
          "Hi, I'm CodeGrind's AI assistant. I can give you hints and help you solve problems. How can I help you today?",
        isAi: true,
        id: 'intro',
      },
    ],
  });
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
  const [extraCreditsEarnedAt, setExtraCreditsEarnedAt] = useState(null);
  const [limitMessageShown, setLimitMessageShown] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adViewed, setAdViewed] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState('short');
  const selectedAdTypeRef = useRef('short');
  const [adCooldownUntil, setAdCooldownUntil] = useState(null);
  const [adCooldownRemaining, setAdCooldownRemaining] = useState(0);
  const [adCooldownMessageShown, setAdCooldownMessageShown] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
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

  // Create dynamic CSS variables based on animation settings
  const chatContainerStyle = {
    '--grid-animation-speed': `${settings?.gridAnimation?.speed || 3}s`,
    '--grid-animation-opacity': settings?.gridAnimation?.opacity || 0.8,
  };

  // Helper function to check if extra credits are expired
  const checkExtraCreditsExpiration = (lastResetTimeStr) => {
    if (!lastResetTimeStr) return true;

    const lastReset = new Date(lastResetTimeStr);
    const now = new Date();
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);

    return hoursSinceReset >= 24;
  };

  useEffect(() => {
    selectedAdTypeRef.current = selectedAdType;
  }, [selectedAdType]);

  useEffect(() => {
    if (!adCooldownUntil) {
      setAdCooldownRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.floor((adCooldownUntil - Date.now()) / 1000));
      setAdCooldownRemaining(remaining);
    };

    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [adCooldownUntil]);

  useEffect(() => {
    if (adCooldownRemaining <= 0 && adCooldownMessageShown) {
      setAdCooldownMessageShown(false);
    }
  }, [adCooldownRemaining, adCooldownMessageShown]);

  // Update addLimitMessage to use Chakra UI Buttons and flex layout
  const addLimitMessage = useCallback(() => {
    if (!limitMessageShown) {
      const limitId = generateUniqueId();
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            content: { type: 'LIMIT_MESSAGE' },
            isAi: true,
            isLimit: true,
            id: limitId,
          },
        ];

        // Filter out any duplicate limit messages
        return filterDuplicateLimitMessages(newMessages);
      });
      setLimitMessageShown(true);
    }
  }, [limitMessageShown, setMessages]);

  const removeLimitMessages = useCallback(() => {
    setMessages((prev) => prev.filter((msg) => !msg.isLimit));
  }, [setMessages]);

  const fetchChatUsage = useCallback(async () => {
    try {
      // Normalize the problem ID before sending to the API
      const normalizedId = normalizeProblemId(problemId);

      const data = await api.chat.getUsage(actorId, normalizedId);
      logger.info('Received chat usage data:');
      logger.debug(data);

      const lastReset = new Date(data.lastResetTime);
      setChatCount(data.chatCount || 0);
      setExtraCredits(data.extraCredits || 0);
      setLastResetTime(lastReset);
      setDailyRemaining(data.dailyRemaining ?? data.remaining ?? null);
      setTotalAllowed(data.totalAllowed ?? null);
      setAdCooldownUntil(data.chatAdCooldownUntil ?? null);
      setAdCooldownRemaining(data.chatAdCooldownRemaining ?? 0);
      setExtraCreditsEarnedAt(data.extraCreditsEarnedAt ?? null);

      const hasReachedLimit = (data.dailyRemaining ?? data.remaining) <= 0;

      if (hasReachedLimit) {
        logger.info('Disabling chat - over limit:');
        logger.debug({
          dailyRemaining: data.dailyRemaining,
        });
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
    } catch (error) {
      logger.error('Error fetching chat usage:');
      logger.debug(error.stack);
      setIsDisabled(true);
    } finally {
      setHasLoadedUsage(true);
    }
  }, [actorId, addLimitMessage, limitMessageShown, problemId, removeLimitMessages, setInput]);

  useEffect(() => {
    if (problemId) {
      setHasLoadedUsage(false);
      setIsDisabled(true);
      void fetchChatUsage();
    }
  }, [problemId, fetchChatUsage]);

  const handleWatchAd = async (adType) => {
    if (!canShowRewardAds) {
      return;
    }
    try {
      const normalizedId = normalizeProblemId(problemId);
      const usage = await api.chat.getUsage(actorId, normalizedId);
      setAdCooldownUntil(usage.chatAdCooldownUntil ?? null);
      setAdCooldownRemaining(usage.chatAdCooldownRemaining ?? 0);

      if ((usage.chatAdCooldownRemaining ?? 0) > 0) {
        if (!adCooldownMessageShown) {
          setMessages((prev) => [
            ...prev,
            {
              content: `Ad cooldown active. Please wait ${formatCooldown(usage.chatAdCooldownRemaining)} before watching another ad.`,
              isWarning: true,
              id: generateUniqueId(),
            },
          ]);
          setAdCooldownMessageShown(true);
        }
        return;
      }
      const resolvedType = adType || selectedAdTypeRef.current || 'short';
      setSelectedAdType(resolvedType);
      // Show the ad first
      setShowAd(true);

      // Wait for a minimum view time (5 seconds)
      setTimeout(() => {
        setAdViewed(true);
      }, 5000);
    } catch (error) {
      //use logger only
      logger.error('Error watching ad:');
      logger.debug(error.stack);
    }
  };

  // Add a function to handle ad completion
  const handleAdComplete = async () => {
    try {
      // Close the ad
      setShowAd(false);
      setAdViewed(false);

      // Give credit to the user
      const normalizedId = normalizeProblemId(problemId);
      const data = await api.chat.addCredit(actorId, normalizedId, selectedAdType);
      setExtraCredits(data.extraCredits);
      setIsDisabled(false);
      setLastResetTime(new Date()); // Update last reset time to track when this credit was earned
      setAdCooldownUntil(data.chatAdCooldownUntil ?? null);
      setAdCooldownRemaining(data.chatAdCooldownRemaining ?? 0);
      setExtraCreditsEarnedAt(data.extraCreditsEarnedAt ?? Date.now());

      setMessages((prev) => [
        ...prev,
        {
          content: `You earned ${chatAdOptions[selectedAdType].credits} extra chat credits! Note: Extra credits expire 24 hours after earning if unused.`,
          isWarning: true,
          id: generateUniqueId(),
        },
      ]);

      // Refresh chat usage to update the UI after adding credit
      await fetchChatUsage();
    } catch (error) {
      logger.error('Error processing ad completion:');
      logger.debug(error.stack);
      if (error?.status === 429 && error?.data) {
        setAdCooldownUntil(error.data.chatAdCooldownUntil ?? null);
        setAdCooldownRemaining(error.data.chatAdCooldownRemaining ?? 0);
        setMessages((prev) => [
          ...prev,
          {
            content:
              error.data.message || 'Ad cooldown active. Please wait before watching another ad.',
            isWarning: true,
            id: generateUniqueId(),
          },
        ]);
      }
    }
  };

  // Display time remaining until extra credits expire
  const getExtraCreditExpiryTime = () => {
    if (!extraCreditsEarnedAt || extraCredits <= 0) return null;

    const earnedDate = new Date(extraCreditsEarnedAt);
    const expiryDate = new Date(earnedDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeRemaining = expiryDate - now;

    if (timeRemaining <= 0) return 'Expired';

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const isAdCooldownActive = adCooldownRemaining > 0;
  const adCooldownLabel = formatCooldown(adCooldownRemaining);

  const renderLimitMessage = () => (
    <LimitMessage
      canShowRewardAds={canShowRewardAds}
      chatAdOptions={chatAdOptions}
      selectedAdType={selectedAdType}
      onSelectAdType={setSelectedAdType}
      isAdCooldownActive={isAdCooldownActive}
      adCooldownLabel={adCooldownLabel}
      onWatchAd={handleWatchAd}
      onUpgrade={() => handleNavigateWithWarning('/pricing')}
    />
  );

  // Update messageVariants for performance in high-res mode
  const messageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  const sendMessage = async (input) => {
    if (!input.trim()) return;
    const messageId = generateUniqueId();
    const normalizedId = normalizeProblemId(problemId);
    try {
      setMessages((prev) => [
        ...prev,
        {
          content: input,
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

      // --- PROMPT INJECTION PREVENTION ---
      const preparedInput = prepareForPrompt(sanitizeOutgoingMessage(input));

      // --- SEND TO BACKEND ---
      const context = buildProblemChatContext({
        problemId,
        draftProblem,
        problemData,
        code,
        executionResult,
        messages,
      });
      const response = await api.chat.sendMessage(
        actorId,
        normalizedId,
        preparedInput,
        assistanceLevel,
        context,
        selectedModel
      );
      logger.info('Chat response received:');
      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => msg.id !== thinkingId));
      // Add AI message to chat with proper formatting
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
      // Fetch updated usage after message is sent
      await fetchChatUsage();
    } catch (error) {
      logger.error('Chat error:');
      logger.debug(error.stack);
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        'Sorry, I encountered an error. Please try again.';
      const isFiltered =
        error?.data?.error === 'content_filter' ||
        (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('filtered'));
      if (isFiltered) {
        try {
          const retryInput = prepareForPrompt(sanitizeOutgoingMessage(input));
          const retryResponse = await api.chat.sendMessage(
            actorId,
            normalizedId,
            retryInput,
            assistanceLevel,
            null,
            selectedModel
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
      // Re-fetch usage on error to ensure proper state
      await fetchChatUsage();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isDisabled || isLoading) return;

    try {
      setIsLoading(true);

      // Get latest usage before sending message with normalized ID
      const normalizedId = normalizeProblemId(problemId);
      const currentUsage = await api.chat.getUsage(actorId, normalizedId);

      const dailyLeft = currentUsage.dailyRemaining ?? currentUsage.remaining ?? Infinity;
      if (dailyLeft <= 0) {
        setIsDisabled(true);

        // Only add limit message if it hasn't been shown yet
        if (!limitMessageShown) {
          addLimitMessage();
        }

        setIsLoading(false);
        return;
      }

      // Send the message
      await sendMessage(input);
      setInput(''); // Clear input after successful send
    } catch (error) {
      logger.error('Chat error:');
      logger.debug(error.stack);
      setMessages((prev) => [
        ...prev,
        {
          content: 'Sorry, I encountered an error. Please try again.',
          isAi: true,
          isError: true,
          id: generateUniqueId(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    if (e.target.value && e.target.value.length === 1) {
      onInputStart();
    }
    setInput(e.target.value);
  };

  const handleNavigateWithWarning = (path) => {
    setPendingPath(path);
    setShowLeaveModal(true);
  };

  const handleLeaveCancel = () => {
    setShowLeaveModal(false);
    setPendingPath(null);
  };

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    if (pendingPath) {
      navigate(pendingPath);
    }
    setPendingPath(null);
  };

  // Reset limit message state when component unmounts or problem changes
  useEffect(() => {
    // Only reset limitMessageShown when component mounts with a new problemId
    setLimitMessageShown(false);

    // Don't reset limitMessageShown on unmount as it can cause issues
    // with React 18's strict mode double-mounting behavior
  }, [problemId]);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_PREF_KEY, readableFont ? 'readable' : 'mono');
    } catch {
      // Ignore storage errors
    }
  }, [readableFont]);

  const resetRemainingSeconds = getResetRemainingSeconds(lastResetTime);
  const chatsLeftLabel = isUnlimited
    ? 'Unlimited'
    : hasLoadedUsage
      ? `${Math.max(0, dailyRemaining ?? 0)} / ${totalAllowed ?? CHAT_LIMITS[membershipTier]}`
      : 'Checking...';
  const adCooldownStatus = canShowRewardAds
    ? isAdCooldownActive
      ? adCooldownLabel
      : 'Ready'
    : 'Not required';
  const statusText = `Chats left: ${chatsLeftLabel} | Refresh: ${(() => {
    if (resetRemainingSeconds === null) return 'Calculating';
    return resetRemainingSeconds <= 0 ? 'Ready' : formatCooldown(resetRemainingSeconds);
  })()} | Ad cooldown: ${adCooldownStatus}`;
  const lowRemainingText =
    dailyRemaining !== null && dailyRemaining > 0 && dailyRemaining <= 5
      ? `${dailyRemaining} chats remaining today`
      : null;
  const extraCreditsText =
    extraCredits > 0
      ? `${extraCredits} extra credits | Expires in: ${getExtraCreditExpiryTime()}`
      : null;
  const chatShellClassName = [
    'chat-container',
    theme === 'retro-desktop' ? 'retro-desktop-chat-shell' : '',
    !animationsEnabled ? 'no-animations' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ChatShell
      className={chatShellClassName}
      style={chatContainerStyle}
      dataFont={readableFont ? 'readable' : 'mono'}
    >
      <LeaveModal
        isOpen={showLeaveModal}
        onCancel={handleLeaveCancel}
        onConfirm={handleLeaveConfirm}
      />
      <RewardAdModal
        isOpen={showAd}
        canShowRewardAds={canShowRewardAds}
        adViewed={adViewed}
        onComplete={handleAdComplete}
        slotId={modalAdSlot}
      />
      <MessageList
        messages={messages}
        animationsEnabled={animationsEnabled}
        messageVariants={messageVariants}
        renderLimitMessage={renderLimitMessage}
      />
      <ChatStatusBar
        statusText={statusText}
        lowRemainingText={lowRemainingText}
        extraCreditsText={extraCreditsText}
      />
      {hasLoadedUsage && isDisabled && canShowRewardAds && (
        <ChatAdActions
          options={chatAdOptions}
          selectedType={selectedAdType}
          onSelectType={setSelectedAdType}
          onWatchAd={() => handleWatchAd()}
          onUpgrade={() => handleNavigateWithWarning('/upgrade')}
          isAdCooldownActive={isAdCooldownActive}
          cooldownLabel={adCooldownLabel}
          watchLabel="Watch Ad"
          upgradeLabel="Upgrade Membership"
        />
      )}
      <ModelSelector
        feature="chat"
        value={selectedModel}
        onChange={setSelectedModel}
        size="xs"
        compact
        theme={theme}
      />
      <Composer
        value={input}
        onChange={handleInputChange}
        onSend={handleSend}
        placeholder={
          !hasLoadedUsage
            ? 'Checking chat access...'
            : isDisabled
              ? 'Chat limit reached'
              : 'Ask for help...'
        }
        disabled={!hasLoadedUsage || isDisabled}
        loading={isLoading}
        readableFont={readableFont}
        onToggleFont={() => setReadableFont((prev) => !prev)}
      />
    </ChatShell>
  );
};

export default Chat;
