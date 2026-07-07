import logger from '../core/logger';

/**
 * Analyzes code to detect programming concepts used across different languages
 * @param {string} code - The submitted code to analyze
 * @param {string} language - The programming language (python, java, javascript, cpp)
 * @returns {Object} - Object with detected concept flags
 */
export const analyzeCode = (code, language) => {
  // Default return structure with all concepts
  const concepts = {
    FOR_LOOP: false,
    WHILE_LOOP: false,
    IF_CONDITION: false,
    VARIABLE: false,
    FUNCTION: false,
    ARRAY: false,
    OBJECT: false,
    RETURN_STATEMENT: false,
    TRY_CATCH: false,
    SWITCH: false,
    LOG: false,
  };

  try {
    // Skip empty code
    if (!code || code.trim() === '') {
      return concepts;
    }

    // Convert to lowercase for easier pattern matching
    const lowerCode = code.toLowerCase();

    // Language-agnostic patterns (common across most languages)
    const patterns = {
      FOR_LOOP: {
        python: /\bfor\s+[\w\s,]+\s+in\s+/i,
        javascript: /\bfor\s*\(/i,
        java: /\bfor\s*\(/i,
        cpp: /\bfor\s*\(/i,
      },
      WHILE_LOOP: {
        python: /\bwhile\s+/i,
        javascript: /\bwhile\s*\(/i,
        java: /\bwhile\s*\(/i,
        cpp: /\bwhile\s*\(/i,
      },
      IF_CONDITION: {
        python: /\bif\s+/i,
        javascript: /\bif\s*\(/i,
        java: /\bif\s*\(/i,
        cpp: /\bif\s*\(/i,
      },
      VARIABLE: {
        python: /(\w+\s*=\s*)|(\blet\s+\w+|const\s+\w+|var\s+\w+)|(\b\w+\s+\w+\s*=)/i,
        javascript: /(\blet\s+\w+|const\s+\w+|var\s+\w+)/i,
        java: /\b(int|float|double|String|boolean|char|long)\s+\w+/i,
        cpp: /\b(int|float|double|std::string|string|bool|char|long)\s+\w+/i,
      },
      FUNCTION: {
        python: /\bdef\s+\w+\s*\(/i,
        javascript: /\bfunction\s+\w+\s*\(|\bconst\s+\w+\s*=\s*\(.*\)\s*=>/i,
        java: /\b(public|private|protected)?\s*\w+\s+\w+\s*\(/i,
        cpp: /\b\w+\s+\w+\s*\(/i,
      },
      ARRAY: {
        python: /(\[.*\])|(\blist\s*\()/i,
        javascript: /(\[.*\])|(\bArray\s*\()/i,
        java: /(new\s+\w+\s*\[)|(\{\s*.*\s*\})/i,
        cpp: /(new\s+\w+\s*\[)|(\{\s*.*\s*\})|(\bvector\s*<)/i,
      },
      OBJECT: {
        python: /(\bclass\s+\w+)|(\{.*:.*\})/i,
        javascript: /(\{.*:.*\})|(\bnew\s+\w+\s*\()|(\bclass\s+\w+)/i,
        java: /\bclass\s+\w+|(\bnew\s+\w+\s*\()/i,
        cpp: /\bclass\s+\w+|(\bstruct\s+\w+)/i,
      },
      RETURN_STATEMENT: {
        python: /\breturn\b/i,
        javascript: /\breturn\b/i,
        java: /\breturn\b/i,
        cpp: /\breturn\b/i,
      },
      TRY_CATCH: {
        python: /\btry\s*:|(\bexcept\b)/i,
        javascript: /\btry\s*\{|(\bcatch\s*\()/i,
        java: /\btry\s*\{|(\bcatch\s*\()/i,
        cpp: /\btry\s*\{|(\bcatch\s*\()/i,
      },
      SWITCH: {
        python: /\bmatch\b.*\bcase\b/i,
        javascript: /\bswitch\s*\(/i,
        java: /\bswitch\s*\(/i,
        cpp: /\bswitch\s*\(/i,
      },
      LOG: {
        python: /\bprint\s*\(/i,
        javascript: /\bconsole\.log\b/i,
        java: /\bSystem\.out\.print(ln)?\b/i,
        cpp: /\b(std::)?cout\b/i,
      },
    };

    // Normalize language name
    const lang = language.toLowerCase();
    const langKey = lang === 'c++' ? 'cpp' : lang === 'python3' ? 'python' : lang;

    // Apply appropriate patterns based on language
    if (!Object.keys(patterns.FOR_LOOP).includes(langKey)) {
      logger.warn(`Unsupported language: ${language}, defaulting to general detection`);
      // Default to general detection for unsupported languages
      Object.keys(concepts).forEach((concept) => {
        concepts[concept] = true; // Just enable all concepts
      });
    } else {
      // Check each concept using language-specific patterns
      Object.keys(concepts).forEach((concept) => {
        if (patterns[concept] && patterns[concept][langKey]) {
          concepts[concept] = patterns[concept][langKey].test(lowerCode);
        }
      });
    }

    // Additional language-specific checks
    if (langKey === 'python') {
      // Python-specific checks (e.g., list comprehensions might count as FOR_LOOPs)
      if (/\[[^[\]]*for[^[\]]+in[^[\]]*\]/i.test(lowerCode)) {
        concepts.FOR_LOOP = true;
      }

      // Dictionary comprehensions for OBJECT
      if (/\{[^{}]*for[^{}]+in[^{}]*\}/i.test(lowerCode)) {
        concepts.OBJECT = true;
      }

      // Check for dictionaries
      if (/\w+\s*=\s*\{[^{}]*:[^{}]*\}/i.test(lowerCode)) {
        concepts.OBJECT = true;
      }
    } else if (langKey === 'javascript') {
      // JavaScript-specific checks (e.g., array methods might count as FOR_LOOPs)
      if (/\.(map|forEach|filter|reduce|some|every)\s*\(/i.test(lowerCode)) {
        concepts.FOR_LOOP = true;
        concepts.ARRAY = true;
      }

      // Object methods
      if (/Object\.(keys|values|entries|assign|create)/i.test(lowerCode)) {
        concepts.OBJECT = true;
      }

      // Arrow functions with implicit return
      if (/=>\s*[^{]/i.test(lowerCode)) {
        concepts.RETURN_STATEMENT = true;
      }
    } else if (langKey === 'java') {
      // Check for Java collections
      if (/\b(ArrayList|List|Set|Map|HashMap|HashSet)\b/.test(lowerCode)) {
        concepts.ARRAY = true;
      }
    } else if (langKey === 'cpp') {
      // Check for C++ STL containers
      if (/\b(vector|array|list|map|set|queue|stack)\b/.test(lowerCode)) {
        concepts.ARRAY = true;
      }
    }

    logger.info('Code analysis results:');
    logger.debug(concepts);

    return concepts;
  } catch (error) {
    logger.error('Error analyzing code:');
    logger.debug(error.stack);
    // Return all concepts as true in case of error
    Object.keys(concepts).forEach((key) => {
      concepts[key] = true;
    });
    return concepts;
  }
};
