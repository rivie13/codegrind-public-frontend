import { useEffect } from 'react';

const MOBILE_MAX_WIDTH = 767;

export function isMobileViewport() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia) {
    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
  }

  return window.innerWidth <= MOBILE_MAX_WIDTH;
}

function getScrollParent(element) {
  if (!element || typeof window === 'undefined') {
    return null;
  }

  let current = element.parentElement;

  while (current && current !== document.body) {
    const styles = window.getComputedStyle(current);
    const overflowY = styles.overflowY;
    const isScrollable = /(auto|scroll|overlay)/.test(overflowY);

    if (isScrollable && current.scrollHeight > current.clientHeight) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getScrollTopForBlock({ scrollParent, targetElement, block = 'center', offset = 0 }) {
  const parentRect = scrollParent.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();

  if (block === 'start') {
    return scrollParent.scrollTop + (targetRect.top - parentRect.top) + offset;
  }

  if (block === 'end') {
    return scrollParent.scrollTop + (targetRect.bottom - parentRect.bottom) + offset;
  }

  return (
    scrollParent.scrollTop +
    (targetRect.top - parentRect.top) -
    (parentRect.height - targetRect.height) / 2 +
    offset
  );
}

export function scrollElementIntoView(targetElement, options = {}) {
  const { block = 'center', behavior = 'smooth', container = null, offset = 0 } = options;

  if (!targetElement) {
    return;
  }

  const scrollParent = container || getScrollParent(targetElement);

  if (scrollParent) {
    const nextTop = Math.max(
      0,
      getScrollTopForBlock({
        scrollParent,
        targetElement,
        block,
        offset,
      })
    );

    if (typeof scrollParent.scrollTo === 'function') {
      scrollParent.scrollTo({
        top: nextTop,
        behavior,
      });
    } else {
      scrollParent.scrollTop = nextTop;
    }

    return;
  }

  if (typeof targetElement.scrollIntoView === 'function') {
    targetElement.scrollIntoView({
      behavior,
      block,
    });
  }
}

export function useAutoScrollIntoView(
  targetRef,
  {
    isOpen,
    enabled = true,
    delayMs = 280,
    repeatDelayMs = 420,
    block = 'center',
    offset = 0,
    containerRef = null,
  } = {}
) {
  useEffect(() => {
    if (!isOpen || !enabled) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    const focusAndScroll = () => {
      const targetElement = targetRef?.current;

      if (!targetElement) {
        return;
      }

      scrollElementIntoView(targetElement, {
        block,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        container: containerRef?.current || null,
        offset,
      });

      if (typeof targetElement.focus === 'function' && document.activeElement !== targetElement) {
        targetElement.focus({ preventScroll: true });
      }
    };

    const initialTimer = setTimeout(focusAndScroll, Math.max(0, delayMs));
    const followUpTimer = setTimeout(
      focusAndScroll,
      Math.max(0, delayMs) + Math.max(0, repeatDelayMs)
    );

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(followUpTimer);
    };
  }, [block, containerRef, delayMs, enabled, isOpen, offset, repeatDelayMs, targetRef]);
}

/**
 * Keep XP awards visible on mobile by auto-scrolling to the XP section
 * whenever a modal opens and XP is awarded.
 */
export function useMobileXpScroll(xpSectionRef, isOpen, totalXpGained = 0, delayMs = 280) {
  useAutoScrollIntoView(xpSectionRef, {
    isOpen,
    enabled: totalXpGained > 0 && isMobileViewport(),
    delayMs,
    repeatDelayMs: 420,
    block: 'center',
  });
}
