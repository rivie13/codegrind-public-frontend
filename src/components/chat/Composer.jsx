import React from 'react';

const Composer = ({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  loading,
  readableFont,
  onToggleFont,
  wrapperClassName = 'chat-input-wrapper',
  containerClassName = 'chat-input-container',
  textareaStyle,
  renderControls,
}) => {
  const isDisabled = disabled || loading;

  return (
    <div className={wrapperClassName}>
      <div className={containerClassName}>
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend?.();
            }
          }}
          disabled={isDisabled}
          style={textareaStyle}
        />
        <div className="chat-input-controls">
          {renderControls ? (
            renderControls({
              isDisabled,
              loading,
              readableFont,
              onToggleFont,
              onSend,
            })
          ) : (
            <>
              <button
                type="button"
                className="font-toggle-button"
                onClick={onToggleFont}
                aria-pressed={readableFont}
                title={readableFont ? 'Switch to mono font' : 'Switch to readable font'}
              >
                Aa
              </button>
              <button onClick={onSend} disabled={isDisabled} className="send-button">
                {loading ? 'Sending...' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Composer;
