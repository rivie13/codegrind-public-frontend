import { useState, useEffect } from 'react';

//import logger from utils
import logger from '../../utils/core/logger';

export function useTestCases(problemData) {
    const [testCases, setTestCases] = useState([]);

    useEffect(() => {
        if (!problemData) return;

        const parseTestCases = () => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = problemData.content;
            
            const preElements = tempDiv.getElementsByTagName('pre');
            const parsedTestCases = [];
            
            Array.from(preElements).forEach(pre => {
                const text = pre.textContent;
                const inputMatch = text.match(/Input: nums = (\[[^\]]+\]), target = (-?\d+)/);
                const outputMatch = text.match(/Output: (\[[^\]]+\])/);
                
                if (inputMatch && outputMatch) {
                    try {
                        const nums = JSON.parse(inputMatch[1]);
                        const target = parseInt(inputMatch[2]);
                        const expectedOutput = JSON.parse(outputMatch[1]);
                        
                        parsedTestCases.push({
                            params: [nums, target],
                            expectedOutput
                        });
                    } catch (e) {
                        //use logger only
                        logger.error('Error parsing test case:');
                        logger.debug(e.stack);
                    }
                }
            });
            
            setTestCases(parsedTestCases);
        };

        parseTestCases();
    }, [problemData]);

    return testCases;
} 