// jsWorker.js - Run JavaScript solutions safely in an isolated worker thread

self.onmessage = function(e) {
  const { code } = e.data;

  // Capture console output
  const logs = [];
  const errors = [];
  
  const originalConsole = {
    log: self.console.log,
    error: self.console.error,
    warn: self.console.warn,
  };

  self.console.log = function(...args) {
    logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    // Keep standard browser logging active
    if (typeof originalConsole.log === 'function') {
      originalConsole.log.apply(self.console, args);
    }
  };

  self.console.error = function(...args) {
    errors.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    if (typeof originalConsole.error === 'function') {
      originalConsole.error.apply(self.console, args);
    }
  };

  self.console.warn = function(...args) {
    logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
    if (typeof originalConsole.warn === 'function') {
      originalConsole.warn.apply(self.console, args);
    }
  };

  // Polyfill process.exit so code wraps calling process.exit don't crash the worker
  self.process = {
    exit: function(code) {
      throw new Error(`Process exited with code ${code}`);
    }
  };

  try {
    // Run evaluation
    // Prevent access to dangerous globals inside the evaluation scope
    const sandbox = new Function('code', `
      const window = undefined;
      const document = undefined;
      const fetch = undefined;
      const localStorage = undefined;
      const sessionStorage = undefined;
      const indexedDB = undefined;
      const XMLHttpRequest = undefined;
      const WebSocket = undefined;
      const location = undefined;
      
      eval(code);
    `);
    
    sandbox(code);
    
    // Return stdout, stderr, and overall success
    self.postMessage({
      success: true,
      stdout: logs.join('\n'),
      stderr: errors.join('\n'),
    });
  } catch (err) {
    self.postMessage({
      success: false,
      error: err.message || String(err),
      stdout: logs.join('\n'),
      stderr: [...errors, err.message || String(err)].join('\n'),
    });
  } finally {
    // Restore console log functions to avoid memory leaks/stale references
    self.console.log = originalConsole.log;
    self.console.error = originalConsole.error;
    self.console.warn = originalConsole.warn;
  }
};
