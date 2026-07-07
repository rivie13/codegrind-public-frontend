import { Box } from '@chakra-ui/react';
import React from 'react';
import Terminal from '../../editor/Terminal';
import '../../editor/Terminal.css';

const EditorFooter = ({ height, minHeight = 200, executionResult, isExecuting, onRun }) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            flex="0 0 auto"
            minHeight={minHeight}
            height={height || '100%'}
            maxHeight="100%"
            overflow="hidden"
            data-tutorial="learning-terminal-area"
        >
            <Terminal
                executionResult={executionResult}
                isLoading={isExecuting}
                onRun={onRun}
            />
        </Box>
    );
};

export default EditorFooter;
