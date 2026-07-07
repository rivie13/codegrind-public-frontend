import { useState } from 'react';

const useChatState = ({ initialMessages = [], initialInput = '' } = {}) => {
    const [messages, setMessages] = useState(initialMessages);
    const [input, setInput] = useState(initialInput);

    return {
        messages,
        setMessages,
        input,
        setInput
    };
};

export default useChatState;
