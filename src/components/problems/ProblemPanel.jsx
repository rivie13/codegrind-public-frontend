import { Box, Spinner } from '@chakra-ui/react';
import DOMPurify from 'dompurify';

function ProblemPanel({ problem, isLoading }) {
  if (isLoading) {
    return (
      <Box className="problem-panel" display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" color="green.500" />
      </Box>
    );
  }

  if (!problem?.data?.question) {
    return (
      <Box className="problem-panel">
        Problem not found
      </Box>
    );
  }

  const { title, difficulty, questionId, content } = problem.data.question;

  return (
    <Box className="problem-panel">
      <h1>{title}</h1>
      <div className="problem-stats">
        {difficulty && (
          <span className={`difficulty ${difficulty}`}>
            {difficulty}
          </span>
        )}
        {questionId && <span>Problem #{questionId}</span>}
      </div>
      <div 
        className="problem-content"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} 
      />
    </Box>
  );
}

export default ProblemPanel; 