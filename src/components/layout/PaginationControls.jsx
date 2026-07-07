import { Box, Button, Flex, HStack, Select, Text } from '@chakra-ui/react';
import React from 'react';

function PaginationControls({ 
  currentPage, 
  totalPages, 
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  currentPageSize = 10,
  buttonStyles = {} 
}) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(e.target.value));
    }
  };

  // Show current page and up to 2 pages before and after
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Show max 5 page buttons
    
    if (totalPages <= maxVisiblePages) {
      // If we have 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate middle pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // If we're not starting from page 2, add ellipsis
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // If we're not ending at second to last page, add ellipsis
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 0) {
    return null; // Don't show pagination if no pages
  }

  // Merge default button styles with provided styles
  const defaultStyles = {
    base: {
      size: "sm",
      variant: "outline",
      colorScheme: "blue",
    },
    active: {
      variant: "solid",
    },
    disabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  };

  const styles = {
    base: { ...defaultStyles.base, ...buttonStyles.base },
    active: { ...defaultStyles.active, ...buttonStyles.active },
    disabled: { ...defaultStyles.disabled, ...buttonStyles.disabled }
  };

  return (
    <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" width="100%">
      {onPageSizeChange && (
        <Flex align="center" mb={{ base: 4, md: 0 }}>
          <Text mr={2} color={styles.base.color || "gray.500"} fontFamily={styles.base.fontFamily || "inherit"}>
            Items per page:
          </Text>
          <Select
            value={currentPageSize}
            onChange={handlePageSizeChange}
            size={styles.base.size || "sm"}
            width="80px"
            bg={styles.base.bg || "transparent"}
            color={styles.base.color || "inherit"}
            borderColor={styles.base.border?.split(' ')[2] || styles.base.borderColor || "inherit"}
            _hover={{ borderColor: styles.base._hover?.borderColor || "blue.500" }}
            fontFamily={styles.base.fontFamily || "inherit"}
            fontSize={styles.base.fontSize || "inherit"}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Select>
        </Flex>
      )}
      
      <HStack spacing={2} justify="center">
        <Button 
          onClick={() => onPageChange(1)}
          isDisabled={currentPage === 1}
          {...styles.base}
          {...(currentPage === 1 ? styles.disabled : {})}
        >
          First
        </Button>
        
        <Button 
          onClick={handlePrevious} 
          isDisabled={currentPage === 1}
          {...styles.base}
          {...(currentPage === 1 ? styles.disabled : {})}
        >
          Prev
        </Button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <Text px={2} color={styles.base.color || "gray.500"} fontFamily={styles.base.fontFamily || "inherit"}>...</Text>
            ) : (
              <Button
                onClick={() => onPageChange(page)}
                {...styles.base}
                {...(currentPage === page ? styles.active : {})}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        
        <Button 
          onClick={handleNext} 
          isDisabled={currentPage === totalPages}
          {...styles.base}
          {...(currentPage === totalPages ? styles.disabled : {})}
        >
          Next
        </Button>
        
        <Button 
          onClick={() => onPageChange(totalPages)}
          isDisabled={currentPage === totalPages}
          {...styles.base}
          {...(currentPage === totalPages ? styles.disabled : {})}
        >
          Last
        </Button>
      </HStack>
      
      <Box display={{ base: 'block', md: 'none' }} height="0" width="0" />
    </Flex>
  );
}

export default PaginationControls; 