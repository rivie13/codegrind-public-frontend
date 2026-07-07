import React from 'react';
import ChatAdActions from './ChatAdActions';

const LimitMessage = ({
    canShowRewardAds,
    chatAdOptions,
    selectedAdType,
    onSelectAdType,
    isAdCooldownActive,
    adCooldownLabel,
    onWatchAd,
    onUpgrade
}) => (
    <div className="limit-message">
        <p>You've reached your AI chat limit.</p>
        <p>{canShowRewardAds ? 'You can watch an ad to earn extra credits, or upgrade to Premium for more daily credits.' : 'Unlimited members do not see terminal ads.'}</p>
        {canShowRewardAds && (
            <ChatAdActions
                options={chatAdOptions}
                selectedType={selectedAdType}
                onSelectType={onSelectAdType}
                onWatchAd={onWatchAd}
                onUpgrade={onUpgrade}
                isAdCooldownActive={isAdCooldownActive}
                cooldownLabel={adCooldownLabel}
                watchLabel="Watch Ad"
                upgradeLabel="Upgrade"
            />
        )}
    </div>
);

export default LimitMessage;
