export const formatTestResults = (formattedData, testCases) => {
    let output = '';
    
    if (formattedData?.testCases) {
        formattedData.testCases.forEach((testCase, index) => {
            output += `Test case details:\n`;
            output += testCase.passed ? '✅ Test Case Passed ✅\n' : '❌ Test Case Failed ❌\n';
            
            // Format input array with proper negative number handling
            const formatArray = (arr) => {
                if (!arr) return 'null';
                if (!Array.isArray(arr)) return arr;
                
                // Handle nested arrays
                if (Array.isArray(arr[0])) {
                    return `[${arr.map(subArr => 
                        Array.isArray(subArr) ? `[${subArr.join(',')}]` : subArr
                    ).join(',')}]`;
                }
                
                // Handle flat arrays
                return `[${arr.join(',')}]`;
            };

            output += `Input: ${formatArray(testCase.input)}\n`;
            output += `Expected Output: ${formatArray(testCase.expectedOutput)}\n`;
            output += `Actual Output: ${formatArray(testCase.actualOutput)}\n`;
            output += `Runtime: ${parseFloat(testCase.runtime || 0).toFixed(2)}s\n`;
            output += `Memory Used: ${((testCase.memory || 0)/1024).toFixed(2)}MB\n`;

            if (!testCase.passed) {
                if (testCase.compile_output) output += `Compilation Error:\n${testCase.compile_output}\n`;
                if (testCase.stderr) output += `Runtime Error:\n${testCase.stderr}\n`;
                if (testCase.message) output += `Message:\n${testCase.message}\n`;
                if (testCase.error) output += `Error:\n${testCase.error}\n`;
            }
            output += `------------------\n`;
        });

        const allTestsPassed = formattedData.testCases.every(testCase => testCase.passed);
        if (allTestsPassed) {
            output += '\nAll test cases passed! 🎉\n';
            // Add performance metrics...
        }
    }
    
    return output;
}; 