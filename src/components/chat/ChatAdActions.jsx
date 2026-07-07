import { Button } from '@chakra-ui/react';

const ChatAdActions = ({
  options,
  selectedType,
  onSelectType,
  onWatchAd,
  onUpgrade,
  isAdCooldownActive,
  cooldownLabel,
  watchLabel = 'Watch Ad',
  upgradeLabel = 'Upgrade',
  showUpgrade = true,
  containerStyle,
  actionsWrapperStyle,
}) => {
  if (!options) return null;

  return (
    <div className="chat-ad-actions" style={containerStyle}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          ...actionsWrapperStyle,
        }}
      >
        {Object.entries(options).map(([type, option]) => (
          <Button
            key={type}
            onClick={() => onSelectType?.(type)}
            color={selectedType === type ? 'var(--cg-link)' : 'var(--cg-text)'}
            size="xs"
            bg={selectedType === type ? 'var(--cg-window-face)' : 'var(--cg-window)'}
            border="1px solid var(--cg-window-shadow)"
            boxShadow={selectedType === type ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'}
            fontFamily="var(--cg-font-retro-display)"
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginTop: '10px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          onClick={onWatchAd}
          color="var(--cg-accent-blue)"
          size="sm"
          fontFamily="var(--cg-font-retro-display)"
          isDisabled={isAdCooldownActive}
        >
          {watchLabel}
        </Button>
        {showUpgrade && (
          <Button
            onClick={onUpgrade}
            color="var(--cg-accent-green)"
            size="sm"
            fontFamily="var(--cg-font-retro-display)"
          >
            {upgradeLabel}
          </Button>
        )}
        {isAdCooldownActive && (
          <div
            className="chat-warning"
            style={{ color: 'var(--cg-accent-amber)', fontSize: '0.8rem' }}
          >
            {`Ad cooldown: ${cooldownLabel || ''}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatAdActions;
