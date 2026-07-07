export const INTERVIEW_UTILS = `# Common interview helper classes
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Common imports
from typing import List, Optional, Dict, Set, Tuple
from collections import defaultdict, deque, Counter
from heapq import heappush, heappop, heapify
import math
import bisect
import re

# Helper functions for linked lists
def create_linked_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def linked_list_to_array(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result
`;

// Default starter code template
export const getStarterCode = (functionName = 'solution') => `def ${functionName}():
    # Write your solution here
    pass
`;

export const wrapUserCode = (code, metaData) => {
  // Add necessary imports
  let wrappedCode = `from typing import List
import json
import sys

${code}

`;

  // Add the test runner
  wrappedCode += `def main():
    solution = Solution()
    test_cases = sys.stdin.read().strip().split('\\n')
    for i in range(0, len(test_cases), ${metaData.params.length}):
        try:
            ${generateInputParsing(metaData)}
            result = solution.${metaData.name}(${metaData.params.map((p) => p.name).join(', ')})
            print(json.dumps(result))
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    main()`;

  return wrappedCode;
};

const generateInputParsing = (metaData) => {
  return metaData.params
    .map((param, index) => {
      const varName = param.name;
      switch (param.type) {
        case 'integer':
          return `${varName} = int(test_cases[i + ${index}])`;
        case 'string':
          return `${varName} = test_cases[i + ${index}]`;
        case 'integer[]':
          return `${varName} = json.loads(test_cases[i + ${index}])`;
        case 'string[]':
          return `${varName} = json.loads(test_cases[i + ${index}])`;
        default:
          return `${varName} = json.loads(test_cases[i + ${index}])`;
      }
    })
    .join('\n            ');
};
