import React from 'react';
import Message from '../../chat/Message';

const ChatMessage = ({
  messageClassName = 'tower-defense-chat-message',
  thinkingIndicatorClassName = 'tower-defense-thinking-indicator',
  messageContentClassName = 'tower-defense-message-content',
  refusalNoteClassName = 'tower-defense-refusal-note',
  refusalPrefix = 'Alert',
  thinkingLabel = 'Neural interface connecting...',
  ...rest
}) => {
  return (
    <Message
      {...rest}
      messageClassName={messageClassName}
      thinkingIndicatorClassName={thinkingIndicatorClassName}
      messageContentClassName={messageContentClassName}
      refusalNoteClassName={refusalNoteClassName}
      refusalPrefix={refusalPrefix}
      thinkingLabel={thinkingLabel}
    />
  );
};

export default ChatMessage;
