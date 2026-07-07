import { ChevronDownIcon } from '@chakra-ui/icons';
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';

/**
 * Retro-styled dropdown for the store. Replaces Chakra's native <Select>
 * (which can't style the browser-native option list) with a fully custom
 * Menu-based dropdown.
 *
 * Props:
 *  value       – currently selected value string
 *  onChange    – (newValue: string) => void
 *  options     – [{ value: string, label: string }]
 *  isDisabled  – boolean
 *  size        – 'sm' | 'md' (default 'md')
 *  mb          – Chakra spacing shorthand (e.g. 2)
 *  width       – CSS width (default '100%')
 */
const StoreSelect = ({
  value,
  onChange,
  options = [],
  isDisabled,
  size = 'md',
  mb,
  width = '100%',
}) => {
  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];
  const isSm = size === 'sm';

  return (
    <Menu matchWidth>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon color="var(--cg-text)" />}
        isDisabled={isDisabled}
        mb={mb}
        width={width}
        textAlign="left"
        bg="var(--cg-window)"
        color="var(--cg-text)"
        border="1px solid var(--cg-window-shadow)"
        borderRadius="0"
        boxShadow="var(--cg-window-outset)"
        px={isSm ? 2 : 3}
        py={isSm ? 1 : 2}
        h={isSm ? '32px' : '40px'}
        fontSize={isSm ? 'xs' : 'sm'}
        fontFamily="var(--cg-font-retro-display)"
        fontWeight="600"
        letterSpacing="0.04em"
        _hover={{ bg: 'var(--cg-window-face)', borderColor: 'var(--cg-window-shadow)' }}
        _active={{ bg: 'var(--cg-window-face)', boxShadow: 'var(--cg-window-inset)' }}
        _disabled={{
          opacity: 0.6,
          cursor: 'not-allowed',
          boxShadow: 'none',
          _hover: { bg: 'var(--cg-window)', borderColor: 'var(--cg-window-shadow)' },
        }}
        sx={{
          '& .chakra-button__icon': {
            marginInlineStart: 'auto',
          },
        }}
        overflow="hidden"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
      >
        {selectedOption?.label ?? ''}
      </MenuButton>

      <MenuList
        bg="var(--cg-window-face)"
        border="1px solid var(--cg-window-shadow)"
        borderRadius="0"
        boxShadow="var(--cg-window-outset), 8px 8px 0 rgba(0, 0, 0, 0.18)"
        maxH="260px"
        overflowY="auto"
        zIndex={1500}
        py={1}
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.08)' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(113,113,113,0.55)',
            borderRadius: '2px',
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => onChange(opt.value)}
            bg={opt.value === value ? 'var(--cg-panel-shell)' : 'transparent'}
            color={opt.value === value ? 'var(--cg-link)' : 'var(--cg-text)'}
            fontFamily="var(--cg-font-retro-display)"
            fontSize={isSm ? 'xs' : 'sm'}
            py={isSm ? 1 : 2}
            px={3}
            _hover={{ bg: 'var(--cg-panel-shell)', color: 'var(--cg-link)' }}
            _focus={{ bg: 'var(--cg-panel-shell)', outline: 'none' }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default StoreSelect;
