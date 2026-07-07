// Create a new utility file for validation functions

export const validateProblem = (problem) => {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // 1. Check for empty required fields
  const requiredFields = ['title', 'difficulty', 'description', 'solution'];
  requiredFields.forEach(field => {
    if (!problem[field] || problem[field].trim() === '') {
      validationResults.isValid = false;
      validationResults.errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`);
    }
  });

  // 2. Check if examples exist and are properly formatted
  if (!problem.examples || problem.examples.length === 0) {
    validationResults.isValid = false;
    validationResults.errors.push('At least one example is required');
  } else {
    problem.examples.forEach((example, index) => {
      if (!example.input || !example.output) {
        validationResults.isValid = false;
        validationResults.errors.push(`Example ${index + 1} must have both input and output`);
      }
    });
  }

  // 3. Check if test cases and expected outputs match in length
  if (
    !problem.testCases || 
    !problem.expectedOutputs || 
    problem.testCases.length !== problem.expectedOutputs.length
  ) {
    validationResults.isValid = false;
    validationResults.errors.push('Test cases and expected outputs must match in number');
  }

  // 4. Check for function name consistency between description and solution
  if (problem.functionName) {
    const functionNameRegex = new RegExp(`function\\s+${problem.functionName}|def\\s+${problem.functionName}|${problem.functionName}\\s*=\\s*function`);
    if (!functionNameRegex.test(problem.solution)) {
      validationResults.warnings.push('Function name in solution may not match the specified function name');
    }
  }

  // 5. Check for inappropriate content using basic filters
  const inappropriatePatterns = [
    /\b(fuck|shit|ass|damn|bitch)\b/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi // Prevent script injection
  ];
  
  const checkContent = (content, fieldName) => {
    if (typeof content !== 'string') return;
    
    inappropriatePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        validationResults.isValid = false;
        validationResults.errors.push(`${fieldName} contains inappropriate content or potential security issues`);
      }
    });
  };

  checkContent(problem.title, 'Title');
  checkContent(problem.description, 'Description');
  checkContent(problem.solution, 'Solution');
  problem.examples?.forEach((example, i) => {
    checkContent(example.input, `Example ${i+1} input`);
    checkContent(example.output, `Example ${i+1} output`);
    checkContent(example.explanation, `Example ${i+1} explanation`);
  });

  return validationResults;
};