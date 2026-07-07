/**
 * Centralized event constants to be used across the application.
 * This ensures consistency when publishing and subscribing to events.
 */

// AI-related events
export const SNIPPET_GENERATED_EVENT = 'aiSnippetGenerated';
export const AI_CHAT_SENT_EVENT = 'aiChatSent';
export const AI_CHAT_RECEIVED_EVENT = 'aiChatReceived';

// Game-related events
export const GAME_STARTED_EVENT = 'gameStarted';
export const GAME_ENDED_EVENT = 'gameEnded';
export const WAVE_STARTED_EVENT = 'waveStarted';
export const WAVE_COMPLETED_EVENT = 'waveCompleted';

// Rate limiting events
export const RATE_LIMIT_UPDATED_EVENT = 'rateLimitUpdated';
export const RATE_LIMIT_EXCEEDED_EVENT = 'rateLimitExceeded';
export const SNIPPET_AD_MODAL_REQUESTED_EVENT = 'snippetAdModalRequested';

// Session events
export const SESSION_INITIALIZED_EVENT = 'sessionInitialized';