import { Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import MarkdownMessage from './MarkdownMessage';

const Message = ({
    message,
    variants,
    animationsEnabled = true,
    renderLimitMessage,
    messageClassName = 'chat-message',
    thinkingIndicatorClassName = 'thinking-indicator',
    messageContentClassName = 'message-content',
    refusalNoteClassName = 'refusal-note',
    refusalPrefix = 'Note',
    thinkingLabel = 'Thinking...',
    thinkingSpinnerProps
}) => {
    return (
        <motion.div
            variants={variants}
            initial={animationsEnabled ? 'initial' : false}
            animate={animationsEnabled ? 'animate' : { opacity: 1 }}
            exit={animationsEnabled ? 'exit' : { opacity: 0 }}
            className={`${messageClassName} ${message.isAi ? 'ai' : 'user'} ${
                message.isWarning ? 'warning' : ''
            } ${message.isError ? 'error' : ''} ${
                message.refusal ? 'refusal' : ''
            }`}
            data-role={message.role || 'assistant'}
        >
            {message.isThinking ? (
                <div className={thinkingIndicatorClassName}>
                    <Spinner size="sm" {...thinkingSpinnerProps} />
                    {thinkingLabel}
                </div>
            ) : (
                <div className={messageContentClassName}>
                    {typeof message.content === 'string' ? (
                        <MarkdownMessage content={message.content} className="message-markdown" />
                    ) : (
                        message.isLimit && message.content?.type === 'LIMIT_MESSAGE'
                            ? (renderLimitMessage ? renderLimitMessage() : message.content)
                            : message.content
                    )}
                    {message.refusal && (
                        <div className={refusalNoteClassName}>
                            {`${refusalPrefix}: ${message.refusal}`}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default Message;
