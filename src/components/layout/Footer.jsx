import { Box, Container, Divider, Grid, GridItem, HStack, Link, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useEffect, useState } from 'react';
import versionData from '../../data/updates/version.json';
import { getSupportEmail } from '../../constants/supportEmail';
import useCompactLandscapeShellMode from '../../hooks/useCompactLandscapeShellMode';

const FOOTER_DISCLAIMER_NOTICE =
  'CodeGrind is an independent platform. Any third-party names or marks referenced in educational, editorial, or comparative contexts belong to their respective owners.';

const footerNoticeTicker = keyframes`
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(-50%);
  }
`;

const detectReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

function Footer() {
  const siteVersion = versionData.version || import.meta.env.VITE_SITE_VERSION;
  const isCompactLandscapeFooterMode = useCompactLandscapeShellMode();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => detectReducedMotion());
  const footerLinkProps = {
    px: 2,
    py: 1,
    border: '1px solid var(--cg-window-shadow)',
    bg: 'var(--cg-window)',
    boxShadow: 'var(--cg-window-outset)',
    color: 'var(--cg-text)',
    textDecoration: 'none',
    _hover: {
      textDecoration: 'none',
      bg: 'var(--cg-panel-shell)',
    },
    _active: {
      boxShadow: 'var(--cg-window-inset)',
      transform: 'translate(1px, 1px)',
    },
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncFooterMode = () => {
      setPrefersReducedMotion(detectReducedMotion());
    };

    syncFooterMode();
    window.addEventListener('resize', syncFooterMode);
    window.addEventListener('orientationchange', syncFooterMode);

    return () => {
      window.removeEventListener('resize', syncFooterMode);
      window.removeEventListener('orientationchange', syncFooterMode);
    };
  }, []);

  return (
    <Box
      as="footer"
      bg="linear-gradient(180deg, var(--cg-window-face-strong) 0%, var(--cg-window) 100%)"
      position="fixed"
      bottom="0"
      width="100%"
      left="0"
      right="0"
      borderTop="2px solid var(--cg-window-light)"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.65), 0 -1px 0 var(--cg-window-dark)"
      zIndex="1000"
      height={isCompactLandscapeFooterMode ? '56px' : { base: '56px', md: '60px' }}
      minHeight={isCompactLandscapeFooterMode ? '56px' : { base: '56px', md: '60px' }}
      py={isCompactLandscapeFooterMode ? 2 : { base: 2, md: 0 }}
      overflow="hidden"
    >
      <Container
        maxW="container.xl"
        px={isCompactLandscapeFooterMode ? 4 : { base: 4, md: '40px' }}
        h={isCompactLandscapeFooterMode ? 'auto' : { base: 'auto', md: '100%' }}
        display="flex"
        alignItems={isCompactLandscapeFooterMode ? 'stretch' : { base: 'stretch', md: 'center' }}
      >
        {/* Mobile footer (compact) */}
        <Box
          width="100%"
          display={isCompactLandscapeFooterMode ? 'flex' : { base: 'flex', md: 'none' }}
          alignItems="center"
          justifyContent="center"
          color="var(--cg-text)"
          fontSize="xs"
        >
          <Text fontWeight="medium" letterSpacing="tight">
            © {new Date().getFullYear()} Riviera Sperduto. All rights reserved.
          </Text>
        </Box>
        {/* Use Grid with three columns */}
        <Grid
          display={isCompactLandscapeFooterMode ? 'none' : { base: 'none', md: 'grid' }}
          templateColumns={{ base: '1fr', md: '1fr 2fr 1fr' }}
          gap={{ base: 2, md: 3 }}
          color="var(--cg-text)"
          fontSize="xs"
          alignItems={{ base: 'start', md: 'center' }}
          width="100%"
        >
          {/* Left: Copyright */}
          <GridItem display="flex" justifyContent={{ base: 'center', md: 'flex-end' }}>
            <Text fontWeight="medium" letterSpacing="tight">
              © {new Date().getFullYear()} Riviera Sperduto. All rights reserved.
            </Text>
          </GridItem>

          {/* Middle: Disclaimer */}
          <GridItem
            textAlign="center"
            display={{ base: 'none', md: 'block' }}
            px={4}
            borderX={{ md: '1px solid' }}
            borderColor={{ md: 'var(--cg-window-dark)' }}
            overflow="hidden"
          >
            {isCompactLandscapeFooterMode ? (
              <Box overflow="hidden" whiteSpace="nowrap" maxW="100%" mx="auto">
                <Box
                  display="inline-flex"
                  minW="max-content"
                  animation={
                    prefersReducedMotion ? undefined : `${footerNoticeTicker} 24s linear infinite`
                  }
                >
                  <Text as="span" fontSize="2xs" flexShrink={0} pr={12}>
                    {FOOTER_DISCLAIMER_NOTICE}
                  </Text>
                  <Text as="span" fontSize="2xs" flexShrink={0} pr={12}>
                    {FOOTER_DISCLAIMER_NOTICE}
                  </Text>
                </Box>
              </Box>
            ) : (
              <Text fontSize="2xs" maxW="600px" mx="auto">
                {FOOTER_DISCLAIMER_NOTICE}
              </Text>
            )}
          </GridItem>

          {/* Right: Links */}
          <GridItem display="flex" justifyContent={{ base: 'center', md: 'flex-end' }}>
            <HStack
              spacing={{ base: 3, md: 5 }}
              divider={
                <Divider orientation="vertical" height="16px" borderColor="var(--cg-window-dark)" />
              }
              px={2}
              py={1}
              bg="rgba(255,255,255,0.18)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
              rowGap={{ base: 2, md: 0 }}
              justify={{ base: 'center', md: 'flex-end' }}
            >
              <Link href="/about" {...footerLinkProps}>
                About
              </Link>
              <Link href="/faq" {...footerLinkProps}>
                FAQ
              </Link>
              <Link href="/privacy-policy" {...footerLinkProps}>
                Privacy
              </Link>
              <Link href="/blog" {...footerLinkProps}>
                Blog
              </Link>
              <Link href="https://stats.uptimerobot.com/MYXleQpuCX" isExternal {...footerLinkProps}>
                Status
              </Link>
              <Link href="/updates" {...footerLinkProps}>
                Version {siteVersion}
              </Link>
              <Link href="https://github.com/rivie13/" isExternal {...footerLinkProps}>
                Riviera's GitHub
              </Link>
              <Link href={`mailto:${getSupportEmail('info')}`} {...footerLinkProps}>
                Contact
              </Link>
            </HStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}

export default Footer;
