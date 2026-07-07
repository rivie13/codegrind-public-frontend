import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'var(--cg-font-retro-display)',
    body: 'var(--cg-font-retro-display)',
    mono: 'var(--cg-font-retro-terminal)',
  },
  fontSizes: {
    xs: 'var(--cg-font-size-xs)',
    sm: 'var(--cg-font-size-sm)',
    md: 'var(--cg-font-size-md)',
  },
  colors: {
    green: {
      400: '#2f8d3d',
      500: '#1f6e2c',
    },
    cyan: {
      400: '#0b7b86',
      500: '#075f68',
    },
    brand: {
      50: '#eef2ff',
      100: '#d9e1ff',
      500: '#2a56d1',
      700: '#000080',
    },
  },
  styles: {
    global: {
      'html, body': {
        bg: 'transparent',
        color: 'var(--cg-text)',
      },
      body: {
        minHeight: 'var(--cg-viewport-height)',
      },
      a: {
        color: 'var(--cg-link)',
      },
      '::selection': {
        bg: 'rgba(10, 56, 154, 0.2)',
        color: 'var(--cg-text)',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 0,
        fontFamily: 'var(--cg-font-retro-display)',
        fontWeight: 700,
        letterSpacing: '0.04em',
        border: '1px solid var(--cg-window-shadow)',
        bg: 'var(--cg-window)',
        color: 'var(--cg-text)',
        boxShadow: 'var(--cg-window-outset)',
        _hover: {
          bg: 'var(--cg-panel-shell)',
        },
        _active: {
          bg: 'var(--cg-window-mid)',
          boxShadow: 'var(--cg-window-inset)',
          transform: 'translate(1px, 1px)',
        },
        _disabled: {
          bg: 'var(--cg-window-face)',
          color: 'var(--cg-muted)',
          boxShadow: 'var(--cg-window-inset)',
          opacity: 1,
        },
      },
      variants: {
        ghost: {
          bg: 'transparent',
          border: '1px solid transparent',
          boxShadow: 'none',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.12)',
          },
          _active: {
            boxShadow: 'none',
            transform: 'none',
          },
        },
        link: {
          color: 'var(--cg-link)',
          boxShadow: 'none',
          border: 'none',
          bg: 'transparent',
          px: 0,
          _hover: {
            textDecoration: 'underline',
            bg: 'transparent',
          },
          _active: {
            transform: 'none',
          },
        },
      },
    },
    Link: {
      baseStyle: {
        color: 'var(--cg-link)',
        fontWeight: 700,
        _hover: {
          color: 'var(--cg-link)',
          textDecoration: 'underline',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'var(--cg-window-face)',
          border: '1px solid var(--cg-window-shadow)',
          borderRadius: 0,
          boxShadow: 'var(--cg-window-outset), 8px 8px 0 rgba(0, 0, 0, 0.18)',
          py: 1,
        },
        item: {
          borderRadius: 0,
          fontFamily: 'var(--cg-font-retro-display)',
          color: 'var(--cg-text)',
          _hover: {
            bg: 'var(--cg-panel-shell)',
          },
          _focus: {
            bg: 'var(--cg-panel-shell)',
          },
          _active: {
            bg: 'var(--cg-window-mid)',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderRadius: 0,
            bg: 'var(--cg-panel-shell)',
            borderColor: 'var(--cg-window-shadow)',
            color: 'var(--cg-text)',
            boxShadow: 'var(--cg-window-inset)',
            _hover: {
              borderColor: 'var(--cg-window-shadow)',
            },
            _focusVisible: {
              borderColor: 'var(--cg-header-start)',
              boxShadow: '0 0 0 1px var(--cg-header-start), var(--cg-window-inset)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            borderRadius: 0,
            bg: 'var(--cg-panel-shell)',
            borderColor: 'var(--cg-window-shadow)',
            color: 'var(--cg-text)',
            boxShadow: 'var(--cg-window-inset)',
            _hover: {
              borderColor: 'var(--cg-window-shadow)',
            },
            _focusVisible: {
              borderColor: 'var(--cg-header-start)',
              boxShadow: '0 0 0 1px var(--cg-header-start), var(--cg-window-inset)',
            },
          },
          icon: {
            color: 'var(--cg-text)',
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Textarea: {
      variants: {
        outline: {
          borderRadius: 0,
          bg: 'var(--cg-panel-shell)',
          borderColor: 'var(--cg-window-shadow)',
          color: 'var(--cg-text)',
          boxShadow: 'var(--cg-window-inset)',
          _hover: {
            borderColor: 'var(--cg-window-shadow)',
          },
          _focusVisible: {
            borderColor: 'var(--cg-header-start)',
            boxShadow: '0 0 0 1px var(--cg-header-start), var(--cg-window-inset)',
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 0,
        border: '1px solid var(--cg-window-shadow)',
        boxShadow: 'var(--cg-window-outset)',
        fontFamily: 'var(--cg-font-retro-display)',
        letterSpacing: '0.04em',
        px: 2,
        py: 1,
      },
    },
    Progress: {
      baseStyle: {
        track: {
          borderRadius: 0,
          bg: 'var(--cg-panel-shell)',
          border: '1px solid var(--cg-window-shadow)',
          boxShadow: 'var(--cg-window-inset)',
        },
        filledTrack: {
          bg: 'repeating-linear-gradient(90deg, #000080 0 12px, #2f56d1 12px 24px)',
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          borderRadius: 0,
          fontFamily: 'var(--cg-font-retro-display)',
          border: '1px solid var(--cg-window-shadow)',
          bg: 'var(--cg-window)',
          color: 'var(--cg-text)',
          boxShadow: 'var(--cg-window-outset)',
          _selected: {
            bg: 'var(--cg-window-face)',
            color: 'var(--cg-text)',
            boxShadow: 'var(--cg-window-inset)',
            transform: 'translate(1px, 1px)',
          },
          _hover: {
            bg: 'var(--cg-panel-shell)',
          },
        },
      },
    },
    Table: {
      baseStyle: {
        th: {
          fontFamily: 'var(--cg-font-retro-display)',
          fontSize: 'xs',
          textTransform: 'uppercase',
          color: 'var(--cg-text)',
          borderColor: 'var(--cg-window-dark)',
        },
        td: {
          borderColor: 'var(--cg-window-mid)',
          color: 'var(--cg-text)',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 0,
          bg: 'var(--cg-window)',
          border: '2px solid var(--cg-window-shadow)',
          boxShadow: 'var(--cg-window-outset), 12px 12px 0 rgba(0, 0, 0, 0.18)',
        },
        header: {
          bg: 'linear-gradient(90deg, var(--cg-header-start) 0%, #2a56d1 100%)',
          color: 'var(--cg-header-text)',
          fontFamily: 'var(--cg-font-retro-display)',
          fontWeight: 700,
          px: 4,
          py: 3,
        },
        body: {
          bg: 'var(--cg-window-face)',
          color: 'var(--cg-text)',
        },
        footer: {
          bg: 'var(--cg-window-face)',
        },
        closeButton: {
          color: 'var(--cg-header-text)',
          borderRadius: 0,
          _hover: {
            bg: 'rgba(255,255,255,0.14)',
          },
        },
      },
    },
  },
});

export default theme;
