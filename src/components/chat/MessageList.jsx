import { AnimatePresence } from 'framer-motion';
import React from 'react';
import Message from './Message';

const defaultMessageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.9
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: {
            duration: 0.2
        }
    }
};

const MessageList = ({
    messages,
    animationsEnabled = true,
    messageVariants,
    renderLimitMessage,
    scrollContainerClassName = 'scroll-container',
    messagesWrapperClassName = 'chat-messages-wrapper',
    messagesClassName = 'chat-messages',
    messageClassName = 'chat-message',
    thinkingIndicatorClassName = 'thinking-indicator',
    MessageComponent = Message,
    messageContentClassName = 'message-content',
    refusalNoteClassName = 'refusal-note',
    refusalPrefix = 'Note',
    thinkingLabel = 'Thinking...',
    thinkingSpinnerProps
}) => {
    const variants = messageVariants || defaultMessageVariants;

    return (
        <div className={scrollContainerClassName}>
            <div className={messagesWrapperClassName}>
                <div className={messagesClassName}>
                    <AnimatePresence>
                        {messages.map((message) => (
                            <MessageComponent
                                key={message.id}
                                message={message}
                                variants={variants}
                                animationsEnabled={animationsEnabled}
                                renderLimitMessage={renderLimitMessage}
                                messageClassName={messageClassName}
                                thinkingIndicatorClassName={thinkingIndicatorClassName}
                                messageContentClassName={messageContentClassName}
                                refusalNoteClassName={refusalNoteClassName}
                                refusalPrefix={refusalPrefix}
                                thinkingLabel={thinkingLabel}
                                thinkingSpinnerProps={thinkingSpinnerProps}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MessageList;
