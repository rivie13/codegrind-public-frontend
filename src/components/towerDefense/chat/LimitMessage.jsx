import React from 'react';
import { Button } from '@chakra-ui/react';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../utils/assets/towerDefenseAssetUrls';

const getRetroButtonSx = (pressed = false) => ({
  minH: '28px',
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
});

const LimitMessage = ({
  canShowRewardAds,
  chatAdOptions,
  selectedAdType,
  onSelectAdType,
  showAdOptions = true,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';

  return (
    <div className="limit-message">
      <p>
        {isRetroDesktopTheme
          ? 'Assistant message limit reached'
          : 'ALERT: Neural interface connection limit reached'}
      </p>
      <p>
        {canShowRewardAds
          ? isRetroDesktopTheme
            ? 'Watch sponsored content for bonus messages, or upgrade for higher limits.'
            : 'Access additional bandwidth by viewing sponsored content or upgrade to Premium for enhanced connectivity.'
          : 'Unlimited members do not see terminal ads.'}
      </p>
      {canShowRewardAds && showAdOptions && (
        <div
          className="limit-actions"
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '8px',
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(chatAdOptions).map(([type, option]) => (
            <Button
              key={type}
              onClick={() => onSelectAdType?.(type)}
              fontFamily={
                isRetroDesktopTheme
                  ? "'Tahoma', 'MS Sans Serif', sans-serif"
                  : "'Orbitron', sans-serif"
              }
              size="xs"
              colorScheme={
                isRetroDesktopTheme ? undefined : selectedAdType === type ? 'purple' : 'gray'
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
      )}
      <div
        className="limit-actions"
        style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '10px' }}
      />
    </div>
  );
};

export default LimitMessage;
