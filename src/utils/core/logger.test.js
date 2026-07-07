import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ status: 200 })),
  },
}));

import axios from 'axios';

const loadLogger = async (nodeEnv = 'development') => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_NODE_ENV', nodeEnv);
  vi.stubEnv('VITE_API_URL', 'https://api.test');
  const module = await import('./logger');
  return module.default;
};

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('formats primitive and object messages safely', async () => {
    const logger = await loadLogger('development');
    const circular = { name: 'node', password: 'secret', token: 'abc' };
    circular.self = circular;

    expect(logger.formatMessage(null)).toBe('null');
    expect(logger.formatMessage(undefined)).toBe('undefined');
    expect(logger.formatMessage(123)).toBe('123');
    expect(logger.formatMessage(circular)).toContain('[Circular Reference]');
    expect(logger.formatMessage(circular)).toContain('[REDACTED]');
  });

  it('formats Error objects and handles serialization failures', async () => {
    const logger = await loadLogger('development');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const formattedError = logger.formatMessage(new Error('boom'));
    const unserializable = logger.formatMessage({ value: 1n });

    expect(formattedError).toContain('Error: boom');
    expect(formattedError).toContain('Stack:');
    expect(unserializable).toContain('[Unserializable Object: object]');
    expect(errorSpy).toHaveBeenCalledWith('Error serializing object:', expect.any(TypeError));
  });

  it('initializes once and registers listeners', async () => {
    const logger = await loadLogger('development');
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const addListenerSpy = vi.spyOn(window, 'addEventListener');

    await logger.initialize();
    await logger.initialize();

    expect(logger.initialized).toBe(true);
    expect(logger.currentBatchTime).toBeTruthy();
    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(addListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('registers periodic flush timer in production', async () => {
    const logger = await loadLogger('production');
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation(() => 1);

    await logger.initialize();

    expect(logger.useAzure).toBe(true);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15 * 60 * 1000);
  });

  it('routes captured window errors through logger.error', async () => {
    const logger = await loadLogger('development');
    const handlers = {};
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, handler) => {
      handlers[eventName] = handler;
    });
    const errorMethodSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    await logger.initialize();
    handlers.error({ message: 'runtime blew up' });
    handlers.unhandledrejection({ reason: 'rejected promise' });

    expect(errorMethodSpy).toHaveBeenCalledWith('Uncaught error: runtime blew up');
    expect(errorMethodSpy).toHaveBeenCalledWith('Unhandled promise rejection: rejected promise');
  });

  it('auto-initializes on first log call', async () => {
    const logger = await loadLogger('development');
    const initializeSpy = vi.spyOn(logger, 'initialize');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await logger.log('boot message', 'INFO');

    expect(initializeSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('[INFO] boot message');
  });

  it('skips flush when azure logging is disabled or the batch is empty', async () => {
    const devLogger = await loadLogger('development');
    devLogger.currentBatch = [{ message: 'x', level: 'WARN', timestamp: 't' }];
    await devLogger.flushLogs();
    expect(axios.post).not.toHaveBeenCalled();

    const prodLogger = await loadLogger('production');
    prodLogger.currentBatch = [];
    await prodLogger.flushLogs();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('flushes batched logs and handles network failures', async () => {
    const logger = await loadLogger('production');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.currentBatch = [
      { message: 'm1', level: 'WARN', timestamp: 't1' },
      { message: 'm2', level: 'ERROR', timestamp: 't2' },
    ];

    await logger.flushLogs();
    await Promise.resolve();
    await Promise.resolve();

    expect(logger.currentBatch).toHaveLength(0);
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledWith('https://api.test/api/logs', {
      message: 'm1',
      level: 'WARN',
      timestamp: 't1',
    });

    axios.post.mockRejectedValueOnce(new Error('network'));
    logger.currentBatch = [{ message: 'm3', level: 'ERROR', timestamp: 't3' }];
    await logger.flushLogs();
    await Promise.resolve();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('Error flushing logs:', expect.any(Error));
  });

  it('handles synchronous flush preparation failures', async () => {
    const logger = await loadLogger('production');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.currentBatch = { length: 1 };

    await logger.flushLogs();

    expect(errorSpy).toHaveBeenCalledWith('Error preparing logs for flush:', expect.any(TypeError));
  });

  it('filters production DEBUG and INFO messages by relevance', async () => {
    const logger = await loadLogger('production');
    logger.initialized = true;
    logger.currentBatch = [];
    logger.currentBatchTime = new Date();
    const flushSpy = vi.spyOn(logger, 'flushLogs').mockResolvedValue();

    await logger.log('heartbeat', 'DEBUG');
    expect(logger.currentBatch).toHaveLength(0);

    await logger.log('Error: stack-trace marker', 'DEBUG');
    expect(logger.currentBatch).toHaveLength(1);
    expect(flushSpy).not.toHaveBeenCalled();

    await logger.log('just noise', 'INFO');
    expect(logger.currentBatch).toHaveLength(1);

    await logger.log('User login successful', 'INFO');
    expect(logger.currentBatch).toHaveLength(1);
  });

  it('logs to console outside production and only batches warn/error in prod', async () => {
    const devLogger = await loadLogger('development');
    devLogger.initialized = true;
    const devConsoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await devLogger.log('development warning', 'WARN');
    expect(devConsoleSpy).toHaveBeenCalledWith('[WARN] development warning');
    expect(devLogger.currentBatch).toHaveLength(0);

    const prodLogger = await loadLogger('production');
    prodLogger.initialized = true;
    prodLogger.currentBatch = [];
    prodLogger.currentBatchTime = new Date(Date.now() - prodLogger.FLUSH_INTERVAL - 1);
    const flushSpy = vi.spyOn(prodLogger, 'flushLogs').mockResolvedValue();

    await prodLogger.log('critical warning', 'WARN');
    expect(prodLogger.currentBatch).toHaveLength(1);
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('delegates helper methods and cookie logging', async () => {
    const logger = await loadLogger('development');
    const logSpy = vi.spyOn(logger, 'log').mockResolvedValue();

    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(logSpy).toHaveBeenNthCalledWith(1, 'd', 'DEBUG');
    expect(logSpy).toHaveBeenNthCalledWith(2, 'i', 'INFO');
    expect(logSpy).toHaveBeenNthCalledWith(3, 'w', 'WARN');
    expect(logSpy).toHaveBeenNthCalledWith(4, 'e', 'ERROR');

    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    logger.logCookies('ctx');
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('Cookies ctx:'));
  });
});
