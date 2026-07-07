import { Box } from '@chakra-ui/react';
import PaginationControls from '../../../../components/layout/PaginationControls';

function PaginationBar({ currentPage, totalPages, onPageChange, onPageSizeChange, pageSize }) {
  return (
    <Box
      w="100%"
      py={4}
      bg="var(--cg-window-face)"
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
      mt={8}
    >
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        currentPageSize={pageSize}
        pageSizeOptions={[10, 25, 50]}
        buttonStyles={{
          base: {
            bg: 'var(--cg-window)',
            color: 'var(--cg-text)',
            border: '1px solid var(--cg-window-shadow)',
            size: 'sm',
            boxShadow: 'var(--cg-window-outset)',
            _hover: {
              bg: 'var(--cg-window-face)',
            },
            fontFamily: 'var(--cg-font-retro-display)',
            fontSize: 'xs',
          },
          active: {
            bg: 'var(--cg-window-face)',
            boxShadow: 'var(--cg-window-inset)',
          },
          disabled: {
            bg: 'var(--cg-window-face)',
            color: 'var(--cg-muted)',
            opacity: 0.4,
            cursor: 'not-allowed',
            boxShadow: 'var(--cg-window-inset)',
          },
        }}
      />
    </Box>
  );
}

export default PaginationBar;
