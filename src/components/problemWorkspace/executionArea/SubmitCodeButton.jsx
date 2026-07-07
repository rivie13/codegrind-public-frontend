import { Button } from '@chakra-ui/react';
import React from 'react';
import { FaCheck } from 'react-icons/fa';

/**
 * Button for submitting code solutions
 * 
 * @param {Object} props
 * @param {Function} props.handleSubmit - Function to submit the code
 * @param {boolean} props.isSubmitting - Whether the submission is in progress
 * @returns {JSX.Element} The submit code button component
 */
const SubmitCodeButton = ({ handleSubmit, isSubmitting }) => {
  return (
    <Button
      leftIcon={<FaCheck />}
      colorScheme="green"
      variant="solid"
      onClick={handleSubmit}
      isLoading={isSubmitting}
      loadingText="Submitting"
      size="md"
    >
      Submit
    </Button>
  );
};

export default SubmitCodeButton; 