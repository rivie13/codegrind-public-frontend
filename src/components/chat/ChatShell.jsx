import React from 'react';

const ChatShell = ({ className, style, dataFont, children }) => {
    return (
        <div className={className} style={style} data-font={dataFont}>
            {children}
        </div>
    );
};

export default ChatShell;
