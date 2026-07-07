import { Spinner } from '@chakra-ui/react';
import React from 'react';
import AdUnit from '../ads/AdUnit';

const RewardAdModal = ({
    isOpen,
    canShowRewardAds,
    adViewed,
    onComplete,
    slotId,
    adType = 'video',
    adCategory = 'reward'
}) => {
    if (!isOpen || !canShowRewardAds) return null;

    return (
        <div className="ad-modal-overlay">
            <div className="ad-modal">
                <div className="ad-modal-header">
                    <h3>Sponsored Content</h3>
                    {adViewed && (
                        <button
                            className="close-ad-button"
                            onClick={onComplete}
                        >
                            Close
                        </button>
                    )}
                </div>
                <div className="ad-modal-content">
                    <AdUnit
                        slotId={slotId}
                        format="fluid"
                        style={{ minHeight: '300px', width: '100%', margin: '0 auto' }}
                        adType={adType}
                        adCategory={adCategory}
                    />
                    {!adViewed ? (
                        <div className="ad-timer">
                            <Spinner size="sm" />
                            <span>Please watch the ad...</span>
                        </div>
                    ) : (
                        <button
                            className="ad-complete-button"
                            onClick={onComplete}
                        >
                            Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RewardAdModal;
