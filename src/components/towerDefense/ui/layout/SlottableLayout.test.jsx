import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockResponsiveProfile = vi.hoisted(() => ({
  isHandheldSinglePanelLayout: false,
  isHandheldCompactLandscape: false,
  isHandheldDevice: false,
}));

vi.mock('../../../../utils/web/responsiveProfile', () => ({
  buildResponsiveProfile: () => mockResponsiveProfile,
}));

import SlottableLayout from './SlottableLayout';
import { resolveMobilePanelSizing, shouldUseFixedHeightMobilePanel } from './mobilePanelSizing';
import { resolveRetroDesktopStageMinHeight } from './SlottableLayout';
import { TD_ONBOARDING_STEP_CHANGE_EVENT } from '../../onboarding/inlineOnboardingEvents';

const setResponsiveProfile = (overrides = {}) => {
  mockResponsiveProfile.isHandheldSinglePanelLayout = false;
  mockResponsiveProfile.isHandheldCompactLandscape = false;
  mockResponsiveProfile.isHandheldDevice = false;
  Object.assign(mockResponsiveProfile, overrides);
};

beforeEach(() => {
  setResponsiveProfile();
});

describe('resolveMobilePanelSizing', () => {
  it('uses a taller desktop stage minimum for standalone retro desktop routes', () => {
    expect(resolveRetroDesktopStageMinHeight('standalone')).toBe('clamp(620px, 80vh, 1000px)');
    expect(resolveRetroDesktopStageMinHeight('embedded')).toBe('420px');
  });

  it('does not force extra minimum height in compact mobile landscape chat focus', () => {
    expect(
      resolveMobilePanelSizing({
        isMobileChatFocus: true,
        isCompactMobileLandscape: true,
      })
    ).toEqual({
      height: 'var(--td-mobile-stage-height, auto)',
      minHeight: 'var(--td-mobile-stage-min-height, 0px)',
    });
  });

  it('keeps the existing taller fallback sizing outside compact landscape', () => {
    expect(
      resolveMobilePanelSizing({
        isMobileChatFocus: false,
        isCompactMobileLandscape: false,
      })
    ).toEqual({
      height: 'min(86dvh, 920px)',
      minHeight: '520px',
    });
  });

  it('uses a bounded panel height when the homepage demo keeps page scroll on handheld', () => {
    expect(
      resolveMobilePanelSizing({
        isMobileChatFocus: false,
        isCompactMobileLandscape: false,
        usePageScrollMobileShell: true,
      })
    ).toEqual({
      height: 'clamp(320px, 68dvh, 560px)',
      minHeight: '320px',
    });
  });

  it('keeps chat taller than the standard bounded panels in handheld page-scroll mode', () => {
    expect(
      resolveMobilePanelSizing({
        isMobileChatFocus: true,
        isCompactMobileLandscape: false,
        usePageScrollMobileShell: true,
      })
    ).toEqual({
      height: 'min(76dvh, 620px)',
      minHeight: '340px',
    });
  });

  it('uses fixed-height slot sizing only for editor and chat in compact mobile landscape', () => {
    expect(
      shouldUseFixedHeightMobilePanel({ activePanel: 'editor', isCompactMobileLandscape: true })
    ).toBe(true);
    expect(
      shouldUseFixedHeightMobilePanel({ activePanel: 'chat', isCompactMobileLandscape: true })
    ).toBe(true);
    expect(
      shouldUseFixedHeightMobilePanel({ activePanel: 'game', isCompactMobileLandscape: true })
    ).toBe(false);
    expect(
      shouldUseFixedHeightMobilePanel({ activePanel: 'problem', isCompactMobileLandscape: true })
    ).toBe(false);
  });
});

describe('SlottableLayout retro desktop theme', () => {
  it('renders the retro desktop shell without crashing', () => {
    render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/CodeGrind Desktop Runtime/i)).toBeInTheDocument();
    expect(screen.getByText(/Taskbar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Game window/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Problem window/i })).toBeInTheDocument();
  });

  it('assigns a taskbar window to the selected desktop slot', () => {
    const onPanelChange = vi.fn();

    render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          onPanelChange={onPanelChange}
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /RIGHT side badge/i }));
    fireEvent.click(screen.getByRole('button', { name: /Problem window/i }));

    expect(onPanelChange).toHaveBeenCalledWith(
      expect.objectContaining({
        leftPanel: 'game',
        rightPanel: 'problem',
        reason: 'user-taskbar-assign-right',
      })
    );
  });

  it('keeps the swapped desktop slot readable when the active step preserves readability', () => {
    const { container } = render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          leftPanel="game"
          rightPanel="problem"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(TD_ONBOARDING_STEP_CHANGE_EVENT, {
          detail: {
            step: {
              id: 'interwave-slot-switch',
              panelFocus: { leftPanel: 'game' },
              preserveFocusReadability: true,
            },
          },
        })
      );
    });

    expect(container.querySelector('[data-desktop-panel-slot="left"]')).toHaveStyle({
      opacity: '1',
    });
    expect(container.querySelector('[data-desktop-panel-slot="right"]')).toHaveStyle({
      opacity: '1',
    });
  });

  it('focuses the desktop slot that currently holds the editor after a taskbar reassignment', () => {
    const { container } = render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          leftPanel="editor"
          rightPanel="problem"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(TD_ONBOARDING_STEP_CHANGE_EVENT, {
          detail: {
            step: {
              id: 'pro-language-warning',
              panelFocus: { rightPanel: 'editor' },
            },
          },
        })
      );
    });

    expect(container.querySelector('[data-desktop-panel-slot="left"]')).toHaveStyle({
      opacity: '1',
    });
    expect(container.querySelector('[data-desktop-panel-slot="right"]')).toHaveStyle({
      opacity: '0.5',
    });
  });

  it('blurs and disables the bottom taskbar slots during the mission-objective step', () => {
    const { container } = render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          leftPanel="game"
          rightPanel="problem"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent(TD_ONBOARDING_STEP_CHANGE_EVENT, {
          detail: {
            step: {
              id: 'mission-objective',
            },
          },
        })
      );
    });

    const taskbar = container.querySelector('[data-tutorial="slot-switch-taskbar"]');
    expect(taskbar).toHaveStyle({
      filter: 'blur(3px)',
      pointerEvents: 'none',
      opacity: '0.65',
    });
  });

  it('uses a single-slot bottom taskbar on handheld retro layouts', () => {
    setResponsiveProfile({
      isHandheldSinglePanelLayout: true,
      isHandheldCompactLandscape: false,
      isHandheldDevice: true,
    });

    render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    expect(
      screen.getByText(/Tap a window below to swap the active mobile panel/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /LEFT side badge/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /RIGHT side badge/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Game window/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Problem/i })).toBeInTheDocument();
  });

  it('uses a wrapped compact taskbar grid on handheld landscape so every panel stays reachable', () => {
    setResponsiveProfile({
      isHandheldSinglePanelLayout: true,
      isHandheldCompactLandscape: true,
      isHandheldDevice: true,
    });

    const { container } = render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    expect(
      container.querySelector('[data-mobile-panel-switcher-layout="compact-grid"]')
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Problem/i })).toBeInTheDocument();
  });

  it('shows the mobile runtime title on handheld devices', () => {
    setResponsiveProfile({ isHandheldDevice: true });

    render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    expect(screen.getByText(/CodeGrind Mobile Runtime/i)).toBeInTheDocument();
    expect(screen.queryByText(/CodeGrind Desktop Runtime/i)).not.toBeInTheDocument();
  });

  it('switches handheld retro runtime into page scroll mode for the homepage demo path', () => {
    setResponsiveProfile({
      isHandheldSinglePanelLayout: true,
      isHandheldCompactLandscape: false,
      isHandheldDevice: true,
    });

    const { container } = render(
      <ChakraProvider>
        <SlottableLayout
          shellTheme="retro-desktop"
          allowEmbeddedHandheldPageScroll
          gameContent={<div>Game content</div>}
          editorContent={<div>Editor content</div>}
          chatContent={<div>Chat content</div>}
          problemContent={<div>Problem content</div>}
        />
      </ChakraProvider>
    );

    expect(container.querySelector('[data-mobile-runtime-scroll-mode="page"]')).toBeTruthy();
  });
});
