import { Button, ButtonGroup } from '@chakra-ui/react';
import React from 'react';
import logger from '../../../utils/core/logger';

const getCategoryButtonProps = (selected) => ({
  bg: selected
    ? 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))'
    : 'var(--cg-panel-shell)',
  color: selected ? 'var(--cg-header-text)' : 'var(--cg-text)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: selected ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)',
  _hover: {
    bg: selected
      ? 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))'
      : 'rgba(255,255,255,0.18)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
  },
  flex: { base: '0 0 auto', md: '1' },
  minW: { base: '120px', md: 'auto' },
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  fontSize: 'xs',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderRadius: '0',
});

const CategorySelector = ({ selectedCategory, setSelectedCategory }) => {
  return (
    <ButtonGroup
      size="sm"
      isAttached
      variant="unstyled"
      mb={4}
      width="100%"
      overflowX={{ base: 'auto', md: 'visible' }}
      overflowY="hidden"
      whiteSpace="nowrap"
      p="2px"
      bg="var(--cg-window-face)"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset)"
      borderRadius="0"
      sx={{
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--cg-panel-shell)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#9f9a90',
          borderRadius: '0',
        },
      }}
    >
      <Button
        onClick={() => setSelectedCategory('interview')}
        {...getCategoryButtonProps(selectedCategory === 'interview')}
      >
        INTERVIEW
      </Button>
      <Button
        onClick={() => {
          // Log the interview TD data when this tab is selected
          logger.info('Interview TD data:');
          setSelectedCategory('interview-td');
        }}
        {...getCategoryButtonProps(selectedCategory === 'interview-td')}
      >
        INTERVIEW.TD
      </Button>
      <Button
        onClick={() => setSelectedCategory('ai')}
        {...getCategoryButtonProps(selectedCategory === 'ai')}
      >
        AI.PROBLEMS
      </Button>
      <Button
        onClick={() => setSelectedCategory('ai-td')}
        {...getCategoryButtonProps(selectedCategory === 'ai-td')}
      >
        AI.TD
      </Button>
    </ButtonGroup>
  );
};

export default CategorySelector;
