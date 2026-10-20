import { Box, Container, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { getSupportEmail } from '../../constants/supportEmail';
import useCompactLandscapeShellMode from '../../hooks/useCompactLandscapeShellMode';

const FOOTER_DISCLAIMER_NOTICE =
  'CodeGrind is an independent platform. Any third-party names or marks referenced in educational, editorial, or comparative contexts belong to their respective owners.';

const FOOTER_COLUMNS = [
  {
    heading: 'Ops',
    links: [
      { label: 'All Ops', href: '/learning' },
      { label: 'Intro Python', href: '/learning/python-path' },
      { label: 'DSA Interview Prep', href: '/problems' },
      { label: 'Browse Sims', href: '/ai-problems/browse' },
      { label: 'Forge a Challenge', href: '/ai-problems/create' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'How It Works', href: '/about' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Practice Guides', href: '/coding-interview-practice' },
      { label: 'Updates', href: '/updates' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy & Your Data', href: '/privacy-policy' },
      { label: 'Contact', href: `mailto:${getSupportEmail('info')}` },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Ranks', href: '/leaderboards' },
      { label: 'Upgrade', href: '/pricing' },
      { label: 'Status', href: 'https://stats.uptimerobot.com/MYXleQpuCX', isExternal: true },
      { label: "Riviera's GitHub", href: 'https://github.com/rivie13/', isExternal: true },
    ],
  },
];

function Footer() {
  const isCompactLandscapeFooterMode = useCompactLandscapeShellMode();

  return (
    <Box
      as="footer"
      bg="linear-gradient(180deg, var(--cg-window-face-strong) 0%, var(--cg-window) 100%)"
      borderTop="2px solid var(--cg-window-light)"
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.65)"
      display={isCompactLandscapeFooterMode ? 'none' : { base: 'none', md: 'block' }}
    >
      <Container maxW="container.xl" px={{ md: '40px' }} py={8}>
        <SimpleGrid columns={{ md: 2, lg: 4 }} spacing={8}>
          {FOOTER_COLUMNS.map((column) => (
            <VStack key={column.heading} align="start" spacing={3}>
              <Text
                fontWeight="700"
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="0.08em"
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
              >
                {column.heading}
              </Text>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  isExternal={link.isExternal}
                  fontSize="sm"
                  color="var(--cg-muted)"
                  fontFamily="var(--cg-font-retro-display)"
                  _hover={{ color: 'var(--cg-link)', textDecoration: 'none' }}
                >
                  {link.label}
                </Link>
              ))}
            </VStack>
          ))}
        </SimpleGrid>
        <Text
          fontSize="2xs"
          color="var(--cg-muted)"
          fontFamily="var(--cg-font-retro-display)"
          textAlign="center"
          maxW="640px"
          mx="auto"
          mt={8}
        >
          {FOOTER_DISCLAIMER_NOTICE}
        </Text>
        <Text
          fontSize="2xs"
          color="var(--cg-muted)"
          fontFamily="var(--cg-font-retro-display)"
          textAlign="center"
          mt={2}
        >
          © {new Date().getFullYear()} Riviera Sperduto. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
}

export default Footer;
