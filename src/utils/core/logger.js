import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const isExpectedCancellation = (reason) => {
  if (!reason) return false;

  const reasonType = String(reason?.type || '').toLowerCase();
  const reasonMsg = String(reason?.msg || reason?.message || reason || '').toLowerCase();

  return (
    reasonType.includes('cancel') ||
    reasonMsg.includes('manually canceled') ||
    reasonMsg.includes('manually cancelled') ||
    reasonMsg.includes('operation is manually canceled') ||
    reasonMsg.includes('operation is manually cancelled') ||
    reasonMsg.includes('aborted') ||
    reasonMsg.includes('aborterror')
  );
};

class Logger {
  constructor() {
    this.currentBatch = [];
    this.currentBatchTime = null;
    this.initialized = false;
    this.BATCH_SIZE = 100; // 100 logs per batch lower for testing
    //this.BATCH_SIZE = 500; // 500 logs per batch for production
    //this.FLUSH_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
    this.FLUSH_INTERVAL = 60 * 10 * 1000; // 10 minutes

    // Only use Azure in production mode
    this.useAzure = import.meta.env.VITE_NODE_ENV === 'production';
  }

  async initialize() {
    if (this.initialized) return;
    this.currentBatchTime = new Date();
    this.initialized = true;

    // Only set up flush interval when Azure logging is enabled
    if (this.useAzure) {
      setInterval(() => this.flushLogs(), 15 * 60 * 1000);
    }

    // Add error listeners
    window.addEventListener('error', (event) => {
      this.error(`Uncaught error: ${event.message}`);
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (isExpectedCancellation(event.reason)) {
        // Expected in dev for manually canceled async operations during remounts/navigation.
        event.preventDefault();
        this.debug(`Ignored canceled promise: ${this.formatMessage(event.reason)}`);
        return;
      }

      this.error(`Unhandled promise rejection: ${this.formatMessage(event.reason)}`);
    });
  }

  // Helper function to safely stringify objects
  formatMessage(message) {
    if (message === null) return 'null';
    if (message === undefined) return 'undefined';

    if (typeof message === 'object') {
      try {
        // For Error objects, include the stack trace
        if (message instanceof Error) {
          return `Error: ${message.message}\nStack: ${message.stack}`;
        }

        // Create a Set to track objects that have been seen
        const seen = new Set();

        // For other objects, properly stringify them
        return JSON.stringify(
          message,
          (key, value) => {
            // Skip sensitive keys like passwords
            if (key === 'password' || key === 'token') {
              return '[REDACTED]';
            }

            // Handle circular references
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular Reference]';
              }
              seen.add(value);
            }
            return value;
          },
          2
        );
      } catch (error) {
        console.error('Error serializing object:', error);
        return `[Unserializable Object: ${typeof message}] (${error.message})`;
      }
    }

    // For non-objects, just convert to string
    return String(message);
  }

  async flushLogs() {
    if (!this.useAzure || this.currentBatch.length === 0) return;

    try {
      console.log('Flushing logs');
      const batchToFlush = [...this.currentBatch];
      // Clear the batch immediately to prevent blocking
      this.currentBatch = [];
      this.currentBatchTime = new Date();

      // Fire and forget - don't await this
      Promise.all(
        batchToFlush.map((log) => {
          return axios.post(`${API_URL}/api/logs`, {
            message: log.message,
            level: log.level,
            timestamp: log.timestamp,
          });
        })
      )
        .then(() => console.log('Successfully flushed logs'))
        .catch((error) => {
          console.error('Error flushing logs:', error);
          // Don't add failed logs back to the batch - just log the error
        });
    } catch (error) {
      console.error('Error preparing logs for flush:', error);
    }
  }

  async log(message, level = 'INFO') {
    if (!this.initialized) {
      await this.initialize();
    }

    const formattedMessage = this.formatMessage(message);
    const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

    // In production: skip non-error DEBUG
    if (isProduction && level === 'DEBUG') {
      const isErrorStack = formattedMessage.includes('Error:') || formattedMessage.includes('at ');
      if (!isErrorStack) {
        return;
      }
    }

    // In production: skip most INFO
    if (isProduction && level === 'INFO') {
      const importantKeywords = [
        'registration',
        'signup',
        'login successful',
        'logout',
        'login',
        'register',
        'log in',
        'Logout',
        'sign up',
        'registered',
        'Log out',
        'Log in',
        'Login',
        'payment',
        'subscription',
        'submission',
        'submitted',
        'error',
        'failed',
      ];

      const isImportant = importantKeywords.some((keyword) =>
        formattedMessage.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!isImportant) {
        return;
      }
    }

    // Console only in dev
    if (!isProduction) {
      console.log(`[${level}] ${formattedMessage}`);
    }

    // Send to backend ONLY: WARN, ERROR, and error-related DEBUG
    const shouldSendToBackend =
      level === 'WARN' ||
      level === 'ERROR' ||
      (level === 'DEBUG' &&
        (formattedMessage.includes('Error:') || formattedMessage.includes('at ')));

    if (this.useAzure && isProduction && shouldSendToBackend) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message: formattedMessage,
      };
      this.currentBatch.push(logEntry);

      if (
        this.currentBatch.length >= this.BATCH_SIZE ||
        (this.currentBatchTime && new Date() - this.currentBatchTime >= this.FLUSH_INTERVAL)
      ) {
        // Don't await - make it non-blocking
        this.flushLogs();
      }
    }
  }

  debug(message) {
    this.log(message, 'DEBUG');
  }
  info(message) {
    this.log(message, 'INFO');
  }
  warn(message) {
    this.log(message, 'WARN');
  }
  error(message) {
    this.log(message, 'ERROR');
  }

  // Helper method specifically for cookies
  logCookies(context = '') {
    this.info(`Cookies ${context}: ${document.cookie || 'No cookies present'}`);
  }
}

export default new Logger();
