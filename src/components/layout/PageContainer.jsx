import { Box, Container } from '@chakra-ui/react';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useCompactLandscapeShellMode from '../../hooks/useCompactLandscapeShellMode';
import PendingEmailBanner from '../banners/PendingEmailBanner';

const PageContainer = ({ children, disableFooterOffset = false, disableTopOffset = false }) => {
  const { user } = useAuth();
  const isCompactLandscapeShellMode = useCompactLandscapeShellMode();

  const topOffset = disableTopOffset ? 0 : '50px';
  const bottomOffset = disableFooterOffset
    ? 0
    : isCompactLandscapeShellMode
      ? 'calc(56px + env(safe-area-inset-bottom))'
      : {
          base: 'calc(56px + env(safe-area-inset-bottom))',
          md: 'calc(60px + env(safe-area-inset-bottom))',
        };

  return (
    <Box
      width="100%"
      minWidth="100%"
      pt={topOffset} // Space for fixed navbar (50px height)
      pb={bottomOffset} // Space for fixed footer (except routes that intentionally render through to the footer)
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
