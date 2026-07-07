import React from 'react';

const ChatStatusBar = ({ statusText, lowRemainingText, extraCreditsText }) => (
  <>
    {statusText && <div className="chat-warning chat-status-text">{statusText}</div>}
    {lowRemainingText && <div className="chat-warning chat-status-low">{lowRemainingText}</div>}
    {extraCreditsText && (
      <div className="chat-extra-credits chat-status-extra">{extraCreditsText}</div>
    )}
  </>
);

export default ChatStatusBar;
