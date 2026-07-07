import { describe, expect, it } from 'vitest';

import {
  AI_CHAT_RECEIVED_EVENT,
  AI_CHAT_SENT_EVENT,
  GAME_ENDED_EVENT,
  GAME_STARTED_EVENT,
  RATE_LIMIT_EXCEEDED_EVENT,
  RATE_LIMIT_UPDATED_EVENT,
  SESSION_INITIALIZED_EVENT,
  SNIPPET_AD_MODAL_REQUESTED_EVENT,
  SNIPPET_GENERATED_EVENT,
  WAVE_COMPLETED_EVENT,
  WAVE_STARTED_EVENT,
} from './events';

describe('core event constants', () => {
  it('defines stable and unique event names', () => {
    const values = [
      SNIPPET_GENERATED_EVENT,
      AI_CHAT_SENT_EVENT,
      AI_CHAT_RECEIVED_EVENT,
      GAME_STARTED_EVENT,
      GAME_ENDED_EVENT,
      WAVE_STARTED_EVENT,
      WAVE_COMPLETED_EVENT,
      RATE_LIMIT_UPDATED_EVENT,
      RATE_LIMIT_EXCEEDED_EVENT,
      SNIPPET_AD_MODAL_REQUESTED_EVENT,
      SESSION_INITIALIZED_EVENT,
    ];

    expect(values).toEqual([
      'aiSnippetGenerated',
      'aiChatSent',
      'aiChatReceived',
      'gameStarted',
      'gameEnded',
      'waveStarted',
      'waveCompleted',
      'rateLimitUpdated',
      'rateLimitExceeded',
      'snippetAdModalRequested',
      'sessionInitialized',
    ]);
    expect(new Set(values).size).toBe(values.length);
  });
});
