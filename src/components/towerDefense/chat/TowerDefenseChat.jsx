import { Box, Button, Spinner } from '@chakra-ui/react';
import React, { forwardRef, useImperativeHandle } from 'react';
import { modalAdSlot } from '../../../config/adSlots';
import { formatCooldown, getResetRemainingSeconds } from '../../chat/chatHelpers';
import AdUnit from '../../ads/AdUnit';
import ModelSelector from '../../common/ModelSelector';
import { ChatShell, Composer, MessageList } from '../../chat/index.js';
import ChatMessage from './ChatMessage';
import LimitMessage from './LimitMessage';
import useTowerDefenseChatState from './useTowerDefenseChatState';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../utils/assets/towerDefenseAssetUrls';
import './TowerDefenseChat.css';

const getRetroButtonSx = (pressed = false) => ({
  minH: '32px',
  borderRadius: '0',
  border: '2px solid #6f6f6f',
  backgroundImage: `url(${pressed ? RETRO_WINDOW_BUTTON_PRESSED_ASSET : RETRO_WINDOW_BUTTON_ASSET})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  backgroundColor: '#d4d0c8',
  color: '#1f2128',
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  fontWeight: '700',
  letterSpacing: '0.02em',
  px: 3,
  boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.24)',
  _hover: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    backgroundColor: '#ece9e1',
    transform: 'translateY(1px)',
  },
  _active: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
  },
  _disabled: {
    opacity: 0.58,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
});

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

const TowerDefenseChat = forwardRef(
  (
    {
      problemId,
      onInputStart,
      shouldLoadUsage = true,
      assistanceLevel,
      problem,
      problemDescription,
      language,
      code,
      terminalOutput,
      shellTheme = 'default',
    },
    ref
  ) => {
    const isRetroDesktopTheme = shellTheme === 'retro-desktop';
    const {
      input,
      readableFont,
      isLoading,
      messages,
      dailyRemaining,
      totalAllowed,
      hasLoadedUsage,
      isDisabled,
      extraCredits,
      lastResetTime,
      showAd,
      adViewed,
      selectedAdType,
      adCooldownRemaining,
      showLeaveModal,
      membershipTier,
      isUnlimited,
      canShowRewardAds,
      chatAdOptions,
      setReadableFont,
      setSelectedAdType,
      handleSend,
      handleInputChange,
      handleWatchAd,
      handleAdComplete,
      handleUpgradeClick,
      handleLeaveCancel,
      handleLeaveConfirm,
      getExtraCreditExpiryTime,
      selectedModel,
      setSelectedModel,
      clearChatHistory,
    } = useTowerDefenseChatState({
      problemId,
      onInputStart,
      shouldLoadUsage,
      assistanceLevel,
      problem,
      problemDescription,
      language,
      code,
      terminalOutput,
    });

    useImperativeHandle(
      ref,
      () => ({
        clearChatHistory,
      }),
      [clearChatHistory]
    );

    return (
      <ChatShell
        className={[
          'tower-defense-chat-container',
          isRetroDesktopTheme ? 'retro-desktop-chat-shell' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        dataFont={readableFont ? 'readable' : 'mono'}
      >
        {showLeaveModal && (
          <div className="tower-defense-leave-modal-overlay" role="dialog" aria-modal="true">
            <div className="tower-defense-leave-modal">
              <div className="tower-defense-leave-modal-header">
                <h3>
                  {isRetroDesktopTheme ? 'Leave assistant window?' : 'Leave neural workspace?'}
                </h3>
              </div>
              <div className="tower-defense-leave-modal-body">
                <p>
                  {isRetroDesktopTheme
                    ? "You're about to navigate away. This chat won't be saved."
                    : "You're about to navigate away. Your progress won't be saved."}
                </p>
              </div>
              <div className="tower-defense-leave-modal-footer">
                <Button
                  onClick={handleLeaveCancel}
                  size="sm"
                  variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                  colorScheme={isRetroDesktopTheme ? undefined : 'gray'}
                  fontFamily={
                    isRetroDesktopTheme
                      ? "'Tahoma', 'MS Sans Serif', sans-serif"
                      : "'Orbitron', sans-serif"
                  }
                  sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
                >
                  Stay
                </Button>
                <Button
                  onClick={handleLeaveConfirm}
                  size="sm"
                  variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                  colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                  fontFamily={
                    isRetroDesktopTheme
                      ? "'Tahoma', 'MS Sans Serif', sans-serif"
                      : "'Orbitron', sans-serif"
                  }
                  sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}
        {showAd && canShowRewardAds && (
          <div className="tower-defense-ad-modal-overlay">
            <div className="tower-defense-ad-modal">
              <div className="tower-defense-ad-modal-header">
                <h3>{isRetroDesktopTheme ? 'Sponsored Content' : 'Sponsored Network Content'}</h3>
                {adViewed && (
                  <Button
                    onClick={handleAdComplete}
                    colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                    size="sm"
                    variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                    fontFamily={
                      isRetroDesktopTheme
                        ? "'Tahoma', 'MS Sans Serif', sans-serif"
                        : "'Orbitron', sans-serif"
                    }
                    sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
                    _hover={
                      isRetroDesktopTheme
                        ? undefined
                        : {
                            boxShadow: '0 0 10px rgba(168, 85, 247, 0.7)',
                          }
                    }
                  >
                    {isRetroDesktopTheme ? 'Close' : 'Terminate'}
                  </Button>
                )}
              </div>
              <div className="tower-defense-ad-modal-content">
                <AdUnit
                  slotId={modalAdSlot}
                  format="fluid"
                  style={{
                    minHeight: '300px',
                    width: '100%',
                    margin: '0 auto',
                    border: '1px solid rgba(128, 0, 255, 0.3)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                  adType="video"
                  adCategory="reward"
                />
                {!adViewed ? (
                  <div className="tower-defense-ad-timer">
                    <Spinner size="sm" color={isRetroDesktopTheme ? '#0a3ca6' : '#a855f7'} />
                    <span>
                      {isRetroDesktopTheme
                        ? 'Loading sponsored content...'
                        : 'Processing data stream...'}
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={handleAdComplete}
                    colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                    width="100%"
                    mt={4}
                    variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                    fontFamily={
                      isRetroDesktopTheme
                        ? "'Tahoma', 'MS Sans Serif', sans-serif"
                        : "'Orbitron', sans-serif"
                    }
                    boxShadow={isRetroDesktopTheme ? undefined : '0 0 10px rgba(168, 85, 247, 0.5)'}
                    sx={isRetroDesktopTheme ? { ...getRetroButtonSx(), width: '100%' } : undefined}
                    _hover={
                      isRetroDesktopTheme
                        ? undefined
                        : {
                            boxShadow: '0 0 15px rgba(168, 85, 247, 0.8)',
                          }
                    }
                  >
                    {isRetroDesktopTheme ? 'Claim Bonus Messages' : 'Upload Bandwidth'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        <MessageList
          messages={messages}
          messageVariants={messageVariants}
          MessageComponent={ChatMessage}
          renderLimitMessage={() => (
            <LimitMessage
              canShowRewardAds={canShowRewardAds}
              chatAdOptions={chatAdOptions}
              selectedAdType={selectedAdType}
              onSelectAdType={setSelectedAdType}
              shellTheme={shellTheme}
            />
          )}
          scrollContainerClassName="tower-defense-scroll-container"
          messagesWrapperClassName="tower-defense-chat-messages-wrapper"
          messagesClassName="tower-defense-chat-messages"
          messageClassName="tower-defense-chat-message"
          thinkingIndicatorClassName="tower-defense-thinking-indicator"
          messageContentClassName="tower-defense-message-content"
          refusalNoteClassName="tower-defense-refusal-note"
          refusalPrefix="Alert"
          thinkingLabel={
            isRetroDesktopTheme ? 'Assistant is typing...' : 'Neural interface connecting...'
          }
          thinkingSpinnerProps={{ color: isRetroDesktopTheme ? '#0a3ca6' : '#a855f7' }}
        />
        <div className="tower-defense-chat-warning">
          <Box
            fontFamily={
              isRetroDesktopTheme
                ? "'Tahoma', 'MS Sans Serif', sans-serif"
                : "'Orbitron', sans-serif"
            }
            color={isRetroDesktopTheme ? '#1f2128' : '#cbd5f5'}
            fontSize="xs"
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px rgba(203, 213, 245, 0.5)'}
            textAlign="center"
            borderTop={
              isRetroDesktopTheme ? '1px solid #8a8a8a' : '1px solid rgba(203, 213, 245, 0.2)'
            }
            borderBottom={
              isRetroDesktopTheme ? '1px solid #8a8a8a' : '1px solid rgba(203, 213, 245, 0.2)'
            }
            py={1}
            bg={isRetroDesktopTheme ? '#ddd8ce' : 'rgba(15, 10, 30, 0.3)'}
          >
            {`${isRetroDesktopTheme ? 'Messages left' : 'Connections left'}: ${isUnlimited ? 'Unlimited' : hasLoadedUsage ? `${Math.max(0, dailyRemaining ?? 0)} / ${(totalAllowed ?? 0) || (membershipTier === 'UNLIMITED' ? 'Unlimited' : '')}` : 'Checking...'}`}
            {` | ${isRetroDesktopTheme ? 'Reset' : 'Refresh'}: ${(() => {
              const resetRemaining = getResetRemainingSeconds(lastResetTime);
              if (resetRemaining === null) return 'Calculating';
              return resetRemaining <= 0 ? 'Ready' : formatCooldown(resetRemaining);
            })()}`}
            {` | ${isRetroDesktopTheme ? 'Bonus cooldown' : 'Ad cooldown'}: ${canShowRewardAds ? (adCooldownRemaining > 0 ? formatCooldown(adCooldownRemaining) : 'Ready') : 'Not required'}`}
          </Box>
        </div>
        {dailyRemaining !== null && dailyRemaining > 0 && dailyRemaining <= 5 && (
          <div className="tower-defense-chat-warning">
            <Box
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              color={isRetroDesktopTheme ? '#7a3f00' : '#ffd700'}
              fontSize="xs"
              textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px rgba(255, 215, 0, 0.5)'}
              textAlign="center"
              borderTop={
                isRetroDesktopTheme ? '1px solid #a57d4f' : '1px solid rgba(255, 215, 0, 0.3)'
              }
              borderBottom={
                isRetroDesktopTheme ? '1px solid #a57d4f' : '1px solid rgba(255, 215, 0, 0.3)'
              }
              py={1}
              bg={isRetroDesktopTheme ? '#f2e0bf' : 'rgba(25, 20, 0, 0.3)'}
            >
              {`${dailyRemaining} assistant messages remaining today`}
            </Box>
          </div>
        )}
        {extraCredits > 0 && (
          <div className="tower-defense-extra-credits">
            <Box
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              color={isRetroDesktopTheme ? '#0a3ca6' : '#a855f7'}
              fontSize="xs"
              textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px rgba(168, 85, 247, 0.5)'}
              textAlign="center"
              borderBottom={
                isRetroDesktopTheme ? '1px solid #8a8a8a' : '1px solid rgba(168, 85, 247, 0.3)'
              }
              py={1}
              bg={isRetroDesktopTheme ? '#e3dfd7' : 'rgba(15, 0, 30, 0.3)'}
            >
              {`${extraCredits} bonus messages | Expires in: ${getExtraCreditExpiryTime()}`}
            </Box>
          </div>
        )}
        {hasLoadedUsage && isDisabled && canShowRewardAds && (
          <div
            className="tower-defense-chat-actions"
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginTop: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {Object.entries(chatAdOptions).map(([type, option]) => (
                <Button
                  key={type}
                  onClick={() => setSelectedAdType(type)}
                  colorScheme={
                    isRetroDesktopTheme ? undefined : selectedAdType === type ? 'purple' : 'gray'
                  }
                  size="xs"
                  fontFamily={
                    isRetroDesktopTheme
                      ? "'Tahoma', 'MS Sans Serif', sans-serif"
                      : "'Orbitron', sans-serif"
                  }
                  variant={
                    isRetroDesktopTheme ? 'unstyled' : selectedAdType === type ? 'solid' : 'outline'
                  }
                  sx={isRetroDesktopTheme ? getRetroButtonSx(selectedAdType === type) : undefined}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => handleWatchAd(selectedAdType)}
              colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
              size="sm"
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              boxShadow={isRetroDesktopTheme ? undefined : '0 0 10px rgba(128, 0, 255, 0.4)'}
              flex={1}
              minWidth="120px"
              sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
            >
              {isRetroDesktopTheme
                ? 'Watch sponsored content for bonus messages'
                : 'View Sponsored Content for Bandwidth'}
            </Button>
            <Button
              onClick={handleUpgradeClick}
              colorScheme={isRetroDesktopTheme ? undefined : 'cyan'}
              size="sm"
              variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              boxShadow={isRetroDesktopTheme ? undefined : '0 0 10px rgba(0, 170, 255, 0.4)'}
              flex={1}
              minWidth="120px"
              sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
            >
              {isRetroDesktopTheme ? 'Upgrade account' : 'Upgrade Neural Interface'}
            </Button>
          </div>
        )}
        <ModelSelector
          feature="chat"
          value={selectedModel}
          onChange={setSelectedModel}
          size="xs"
          compact
          theme={shellTheme}
        />
        <Composer
          value={input}
          onChange={handleInputChange}
          onSend={handleSend}
          placeholder={
            !hasLoadedUsage
              ? isRetroDesktopTheme
                ? 'Checking assistant access...'
                : 'Checking neural interface...'
              : isDisabled
                ? isRetroDesktopTheme
                  ? 'Assistant unavailable'
                  : 'Neural interface disconnected'
                : isRetroDesktopTheme
                  ? 'Ask for help with this mission...'
                  : 'Enter query...'
          }
          disabled={!hasLoadedUsage || isDisabled}
          loading={isLoading}
          readableFont={readableFont}
          onToggleFont={() => setReadableFont((prev) => !prev)}
          wrapperClassName="tower-defense-chat-input-wrapper"
          containerClassName="tower-defense-chat-input-container"
          textareaStyle={{
            fontFamily: 'inherit',
            background: isRetroDesktopTheme ? '#fbf8f2' : 'rgba(15, 0, 30, 0.8)',
            color: isRetroDesktopTheme ? '#1f2128' : '#d8b4fe',
            border: isRetroDesktopTheme ? '2px solid #6f6f6f' : '1px solid rgba(128, 0, 255, 0.4)',
            boxShadow: isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(104,104,104,0.18)'
              : '0 0 5px rgba(128, 0, 255, 0.2) inset',
            borderRadius: isRetroDesktopTheme ? '0' : '6px',
            padding: '8px 12px',
          }}
          renderControls={({
            isDisabled: isComposerDisabled,
            loading: composerLoading,
            readableFont: composerReadableFont,
            onToggleFont,
            onSend,
          }) => (
            <>
              <Button
                onClick={onToggleFont}
                size="sm"
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                fontFamily={
                  isRetroDesktopTheme
                    ? "'Tahoma', 'MS Sans Serif', sans-serif"
                    : "'Orbitron', sans-serif"
                }
                aria-pressed={composerReadableFont}
                title={composerReadableFont ? 'Switch to mono font' : 'Switch to readable font'}
                boxShadow={isRetroDesktopTheme ? undefined : '0 0 6px rgba(128, 0, 255, 0.3)'}
                sx={isRetroDesktopTheme ? getRetroButtonSx(composerReadableFont) : undefined}
              >
                Aa
              </Button>
              <Button
                onClick={onSend}
                isDisabled={isComposerDisabled}
                colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
                fontFamily={
                  isRetroDesktopTheme
                    ? "'Tahoma', 'MS Sans Serif', sans-serif"
                    : "'Orbitron', sans-serif"
                }
                boxShadow={isRetroDesktopTheme ? undefined : '0 0 10px rgba(128, 0, 255, 0.4)'}
                _hover={{
                  ...(isRetroDesktopTheme
                    ? {}
                    : {
                        boxShadow: '0 0 15px rgba(128, 0, 255, 0.6)',
                      }),
                }}
                _disabled={{
                  opacity: 0.7,
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                }}
                sx={isRetroDesktopTheme ? getRetroButtonSx() : undefined}
              >
                {composerLoading
                  ? isRetroDesktopTheme
                    ? 'Sending...'
                    : 'Connecting...'
                  : isRetroDesktopTheme
                    ? 'Send'
                    : 'Transmit'}
              </Button>
            </>
          )}
        />
      </ChatShell>
    );
  }
);

export default TowerDefenseChat;
