import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Link,
  ListItem,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import PageSeo from '../../components/seo/PageSeo';
import { SITE_ORIGIN } from '../../components/seo/siteMetadata';
import adSlots from '../../config/adSlots';
import { SEO_LANDING_PAGES } from '../../data/seoLandingPages';

const retroBadgeProps = {
  bg: 'var(--cg-window-face)',
  color: 'var(--cg-text)',
  border: '1px solid var(--cg-window-dark)',
  boxShadow: 'var(--cg-window-outset)',
  borderRadius: '0',
  px: 2,
  py: 1,
  fontFamily: 'var(--cg-font-retro-display)',
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const retroButtonProps = {
  bg: 'var(--cg-window-face)',
  color: 'var(--cg-text)',
  border: '1px solid var(--cg-window-dark)',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  whiteSpace: 'normal',
  _hover: { bg: 'var(--cg-panel-shell)' },
  _active: { boxShadow: 'var(--cg-window-inset)' },
};

const buildPageSchema = (page) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: page.title,
  url: `${SITE_ORIGIN}${page.path}`,
  description: page.description,
  isPartOf: {
    '@type': 'WebSite',
    name: 'CodeGrind',
    url: `${SITE_ORIGIN}/`,
  },
  about: page.schemaTopics.map((topic) => ({
    '@type': 'Thing',
    name: topic,
  })),
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: page.highlights.map((highlight, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: highlight,
    })),
  },
});

const buildBreadcrumbSchema = (page) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'CodeGrind',
      item: `${SITE_ORIGIN}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: page.title,
      item: `${SITE_ORIGIN}${page.path}`,
    },
  ],
});

const buildFaqSchema = (page) => {
  if (!page.faqs || page.faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

function SeoLandingPage({ pageId }) {
  const page = SEO_LANDING_PAGES.find((entry) => entry.id === pageId);

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageTemplate>
      <PageSeo
        title={page.title}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(buildPageSchema(page))}</script>
        <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(page))}</script>
        {page.faqs && page.faqs.length > 0 ? (
          <script type="application/ld+json">{JSON.stringify(buildFaqSchema(page))}</script>
        ) : null}
      </Helmet>
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>
      <Container maxW="container.xl" px={{ base: 4, md: 8 }} py={{ base: 10, md: 16 }}>
        <VStack spacing={{ base: 8, md: 12 }} align="stretch">
          {page.ragSnippet ? (
            <RetroPanel
              fileLabel="engine-specification.txt"
              titlebarActions={<Badge {...retroBadgeProps}>RAG SUMMARY</Badge>}
            >
              <VStack align="stretch" spacing={3}>
                <Heading
                  as="h2"
                  size="md"
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {page.ragSnippet.heading}
                </Heading>
                <Text
                  color="var(--cg-text)"
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontFamily="var(--cg-font-retro-display)"
                  lineHeight="1.8"
                >
                  {page.ragSnippet.body}
                </Text>
              </VStack>
            </RetroPanel>
          ) : null}

          <RetroPanel
            fileLabel={`${page.id}.exe`}
            title={page.heroTitle}
            subtitle={page.intro}
            titlebarActions={<Badge {...retroBadgeProps}>{page.eyebrow}</Badge>}
          >
            <VStack align="stretch" spacing={5}>
              <Text
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
                lineHeight="1.8"
              >
                CodeGrind is the platform. Code Breach is its first live featured game: an actual
                tower defense coding experience where you solve real problems, protect your base,
                and build skills that carry into beginner learning paths, problem clusters, and
                interview-ready practice.
              </Text>

              <RetroInset p={{ base: 4, md: 5 }}>
                <Button
                  as={RouterLink}
                  to="/"
                  width="100%"
                  minH={{ base: '64px', md: '72px' }}
                  px={{ base: 4, md: 8 }}
                  py={{ base: 4, md: 5 }}
                  fontSize={{ base: 'md', md: 'xl' }}
                  lineHeight="1.25"
                  textAlign="center"
                  {...retroButtonProps}
                >
                  Try Demo Now - Beginner Friendly + Interview Ready
                </Button>
                <Text
                  color="var(--cg-muted)"
                  mt={3}
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontFamily="var(--cg-font-retro-display)"
                  lineHeight="1.7"
                >
                  Start with a simple Code Breach getting-started problem on the homepage, then
                  branch into the rest of CodeGrind through Beginner Learning Paths or Interview
                  Prep Clusters.
                </Text>
              </RetroInset>

              <HStack spacing={3} flexWrap="wrap" rowGap={3}>
                <Button as={RouterLink} to="/learning" {...retroButtonProps}>
                  Beginner? Pick a Path
                </Button>
                <Button as={RouterLink} to={page.primaryCta.path} {...retroButtonProps}>
                  {page.primaryCta.label}
                </Button>
                <Button as={RouterLink} to={page.secondaryCta.path} {...retroButtonProps}>
                  {page.secondaryCta.label}
                </Button>
              </HStack>
            </VStack>
          </RetroPanel>

          <RetroPanel
            fileLabel="practice-goals.ini"
            title="Practice Goals"
            subtitle="Common intents this page is designed to answer."
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {page.searchIntents.map((intent) => (
                <RetroInset key={intent} px={3} py={2.5}>
                  <Text
                    color="var(--cg-text)"
                    fontSize="sm"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    {intent}
                  </Text>
                </RetroInset>
              ))}
            </SimpleGrid>
          </RetroPanel>

          <RetroPanel fileLabel="highlights.txt" title="What You Get">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
              {page.highlights.map((highlight) => (
                <RetroInset key={highlight} p={5}>
                  <Text
                    color="var(--cg-text)"
                    lineHeight="1.7"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    {highlight}
                  </Text>
                </RetroInset>
              ))}
            </SimpleGrid>
          </RetroPanel>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
            {page.sections.map((section) => (
              <RetroPanel key={section.heading} fileLabel="summary.dat" title={section.heading}>
                <Text
                  color="var(--cg-muted)"
                  lineHeight="1.75"
                  fontFamily="var(--cg-font-retro-display)"
                >
                  {section.body}
                </Text>
              </RetroPanel>
            ))}
          </SimpleGrid>

          {page.longFormSections && page.longFormSections.length > 0 ? (
            <VStack spacing={5} align="stretch">
              {page.longFormSections.map((section) => (
                <RetroPanel key={section.heading} fileLabel="deep-dive.txt" title={section.heading}>
                  <VStack align="stretch" spacing={4}>
                    {section.paragraphs.map((paragraph, index) => (
                      <Text
                        key={`${section.heading}-${index}`}
                        color="var(--cg-muted)"
                        fontSize={{ base: 'md', md: 'lg' }}
                        fontFamily="var(--cg-font-retro-display)"
                        lineHeight="1.85"
                      >
                        {paragraph}
                      </Text>
                    ))}
                  </VStack>
                </RetroPanel>
              ))}
            </VStack>
          ) : null}

          {page.comparisonTable ? (
            <RetroPanel
              fileLabel="comparison.tbl"
              title={page.comparisonTable.heading}
              subtitle={page.comparisonTable.caption}
            >
              <RetroInset p={{ base: 2, md: 3 }}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg="rgba(255,255,255,0.14)">
                      <Tr>
                        {page.comparisonTable.headers.map((header) => (
                          <Th
                            key={header}
                            color="var(--cg-text)"
                            borderColor="var(--cg-window-dark)"
                            fontFamily="var(--cg-font-retro-display)"
                            textTransform="uppercase"
                            letterSpacing="0.08em"
                          >
                            {header}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {page.comparisonTable.rows.map((row, rowIndex) => (
                        <Tr key={`row-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <Td
                              key={`row-${rowIndex}-cell-${cellIndex}`}
                              color="var(--cg-text)"
                              borderColor="var(--cg-window-dark)"
                              whiteSpace="normal"
                              verticalAlign="top"
                              fontFamily="var(--cg-font-retro-display)"
                            >
                              {cell}
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </RetroInset>
            </RetroPanel>
          ) : null}

          {page.faqs && page.faqs.length > 0 ? (
            <RetroPanel fileLabel="faq.log" title="Frequently Asked Questions">
              <VStack align="stretch" spacing={5}>
                {page.faqs.map((faq) => (
                  <RetroInset key={faq.question} p={{ base: 4, md: 5 }}>
                    <Heading
                      as="h3"
                      size="sm"
                      color="var(--cg-text)"
                      mb={2}
                      fontFamily="var(--cg-font-retro-display)"
                      textTransform="uppercase"
                      letterSpacing="0.06em"
                    >
                      {faq.question}
                    </Heading>
                    <Text
                      color="var(--cg-muted)"
                      lineHeight="1.75"
                      fontFamily="var(--cg-font-retro-display)"
                    >
                      {faq.answer}
                    </Text>
                  </RetroInset>
                ))}
              </VStack>
            </RetroPanel>
          ) : null}

          <RetroPanel fileLabel="related-pages.lnk" title="Related CodeGrind Pages">
            <UnorderedList
              spacing={2}
              color="var(--cg-text)"
              stylePosition="inside"
              m={0}
              fontFamily="var(--cg-font-retro-display)"
              sx={{ '& li::marker': { color: 'var(--cg-link)' } }}
            >
              {page.relatedPages.map((relatedPage) => (
                <ListItem key={`${page.id}-${relatedPage.path}`}>
                  <Link
                    as={RouterLink}
                    to={relatedPage.path}
                    color="var(--cg-link)"
                    _hover={{ color: 'var(--cg-link-active)', textDecoration: 'underline' }}
                  >
                    {relatedPage.label}
                  </Link>
                </ListItem>
              ))}
            </UnorderedList>
          </RetroPanel>
        </VStack>
      </Container>
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={4} pb={10}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default SeoLandingPage;
