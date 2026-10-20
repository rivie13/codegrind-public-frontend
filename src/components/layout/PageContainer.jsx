import { Box, Container } from '@chakra-ui/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PendingEmailBanner from '../banners/PendingEmailBanner';

const PageContainer = ({ children, disableTopOffset = false }) => {
  const { user } = useAuth();

  const topOffset = disableTopOffset ? 0 : '50px';

  return (
    <Box
      width="100%"
      minWidth="100%"
      pt={topOffset} // Space for fixed navbar (50px height)
      px={0}
      mx="auto"
      className="page-container cg-desktop-workspace"
      backgroundColor="transparent"
      position="relative"
      boxSizing="border-box"
      minHeight="auto"
      height="auto"
      display="flex"
      flexDirection="column"
      overflow="visible"
    >
      {user?.pendingEmail && (
        <Container maxW="container.xl" px={4} pt={4}>
          <PendingEmailBanner pendingEmail={user.pendingEmail} />
        </Container>
      )}
      {children}
    </Box>
  );
};

export default PageContainer;
