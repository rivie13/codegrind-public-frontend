import { Button } from '@chakra-ui/react';
import React from 'react';
import { FaPlay } from 'react-icons/fa';

/**
 * Button for running code
 * 
 * @param {Object} props
 * @param {Function} props.handleRunCode - Function to run the code
 * @param {boolean} props.isExecuting - Whether code is currently executing
 * @returns {JSX.Element} The run code button component
 */
const RunCodeButton = ({ handleRunCode, isExecuting }) => {
  return (
    <Button
      leftIcon={<FaPlay />}
      colorScheme="teal"
      variant="solid"
      onClick={handleRunCode}
      isLoading={isExecuting}
      loadingText="Running"
      size="md"
    >
      Run Code
    </Button>
  );
};

export default RunCodeButton; 