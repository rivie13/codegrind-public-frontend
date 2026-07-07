import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useChatState from './useChatState.js';

describe('useChatState', () => {
  it('initializes with empty messages and input by default', () => {
    const { result } = renderHook(() => useChatState());
    expect(result.current.messages).toEqual([]);
    expect(result.current.input).toBe('');
  });

  it('accepts initial messages', () => {
    const initial = [{ id: 1, text: 'hello' }];
    const { result } = renderHook(() => useChatState({ initialMessages: initial }));
    expect(result.current.messages).toEqual(initial);
  });

  it('accepts initial input value', () => {
    const { result } = renderHook(() => useChatState({ initialInput: 'draft' }));
    expect(result.current.input).toBe('draft');
  });

  it('updates messages via setMessages', () => {
    const { result } = renderHook(() => useChatState());
    act(() => {
      result.current.setMessages([{ id: 1, text: 'new message' }]);
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('new message');
  });

  it('updates input via setInput', () => {
    const { result } = renderHook(() => useChatState());
    act(() => {
      result.current.setInput('typed text');
    });
    expect(result.current.input).toBe('typed text');
  });

  it('exposes setMessages and setInput functions', () => {
    const { result } = renderHook(() => useChatState());
    expect(typeof result.current.setMessages).toBe('function');
    expect(typeof result.current.setInput).toBe('function');
  });
});
