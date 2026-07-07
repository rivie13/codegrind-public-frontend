import { Box } from '@chakra-ui/react';
import React from 'react';
import CityReturnBanner from './CityReturnBanner';

/**
 * PageTemplate - A template for page content that works with PageContainer
 *
 * Usage example:
 *
 * function MyPage() {
 *   return (
 *     <PageTemplate>
 *       <MyPageContent />
 *     </PageTemplate>
 *   );
 * }
 */
const PageTemplate = ({ children, showCityReturnBanner = true }) => {
  return (
    <Box
      className="cg-page-template"
      width="100%"
      minHeight="100%"
      height="auto"
      display="flex"
      flexDirection="column"
      flex="1 0 auto"
      position="relative"
      overflow="visible"
    >
      <Box position="relative" zIndex="1" className="cg-page-template-content">
        {showCityReturnBanner ? <CityReturnBanner /> : null}
        {children}
      </Box>
    </Box>
  );
};

export default PageTemplate;
