import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Link,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useParams } from 'react-router-dom';

import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import PageSeo from '../../components/seo/PageSeo';
import { buildAbsoluteUrl, buildCanonicalUrl, SITE_NAME } from '../../components/seo/siteMetadata';
import adSlots from '../../config/adSlots';
import { getNativeBlogPostBySlug } from '../../data/nativeBlogPosts';

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
  _hover: { bg: 'var(--cg-panel-shell)' },
  _active: { boxShadow: 'var(--cg-window-inset)' },
};

const formatIso = (date) => (date ? new Date(date).toISOString() : undefined);

const buildArticleSchema = (post) => {
  const url = buildCanonicalUrl(`/blog/codegrind/${post.slug}`);
  const image = post.heroImage ? buildAbsoluteUrl(post.heroImage) : buildAbsoluteUrl('/logo.svg');
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.description,
    image,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'CodeGrind Team',
      ...(post.author?.url ? { url: post.author.url } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: buildAbsoluteUrl('/logo.svg'),
      },
    },
    datePublished: formatIso(post.publishedAt),
    dateModified: formatIso(post.updatedAt || post.publishedAt),
  };
};

const buildBreadcrumbSchema = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonicalUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: buildCanonicalUrl('/blog') },
    {
      '@type': 'ListItem',
      position: 3,
      name: post.title,
      item: buildCanonicalUrl(`/blog/codegrind/${post.slug}`),
    },
  ],
});

const buildFaqSchema = (post) => {
  if (!post.faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
};

function NotFoundState() {
  return (
    <PageTemplate>
      <PageSeo
        title="Article Not Found"
        description="This CodeGrind article could not be found."
        path="/blog"
        robots="noindex,follow"
      />
      <Container maxW="container.md" py={{ base: 10, md: 16 }}>
        <RetroPanel
          fileLabel="article.log"
          title="Article Not Found"
          subtitle="We could not find a CodeGrind article at this URL. It may have been moved or unpublished."
        >
          <Button
            as={RouterLink}
            to="/blog"
            alignSelf="flex-start"
            leftIcon={<ArrowBackIcon />}
            {...retroButtonProps}
          >
            Back To The Blog
          </Button>
        </RetroPanel>
      </Container>
    </PageTemplate>
  );
}

function NativeBlogPostPage({ slug: slugProp }) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const post = getNativeBlogPostBySlug(slug);

  if (!post) {
    return <NotFoundState />;
  }

  const articleSchema = buildArticleSchema(post);
  const breadcrumbSchema = buildBreadcrumbSchema(post);
  const faqSchema = buildFaqSchema(post);

  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <PageTemplate>
      <PageSeo
        title={post.title}
        description={post.description}
        path={`/blog/codegrind/${post.slug}`}
        image={post.heroImage || '/logo.svg'}
        keywords={post.keywords}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema ? <script type="application/ld+json">{JSON.stringify(faqSchema)}</script> : null}
      </Helmet>

      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      <Container maxW="container.md" py={{ base: 6, md: 10 }}>
        <VStack spacing={{ base: 5, md: 6 }} align="stretch">
          <Button
            as={RouterLink}
            to="/blog"
            alignSelf="flex-start"
            leftIcon={<ArrowBackIcon />}
            size={{ base: 'sm', md: 'md' }}
            {...retroButtonProps}
          >
            Back to Blog
          </Button>

          <RetroPanel
            fileLabel={`${post.slug}.md`}
            title={post.title}
            subtitle={post.intro}
            titlebarActions={<Badge {...retroBadgeProps}>CodeGrind Original</Badge>}
          >
            <VStack align="stretch" spacing={{ base: 4, md: 5 }}>
              <HStack spacing={3} flexWrap="wrap">
                {post.eyebrow ? <Badge {...retroBadgeProps}>{post.eyebrow}</Badge> : null}
                {publishedLabel ? <Badge {...retroBadgeProps}>{publishedLabel}</Badge> : null}
                {post.author?.name ? (
                  <Text
                    color="var(--cg-muted)"
                    fontSize="sm"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    by {post.author.name}
                  </Text>
                ) : null}
              </HStack>

              {post.heroImage ? (
                <RetroInset p={2}>
                  <Image
                    src={post.heroImage}
                    alt={post.title}
                    maxH={{ base: '220px', md: '360px' }}
                    objectFit="cover"
                    w="100%"
                  />
                </RetroInset>
              ) : null}

              {post.video ? (
                <RetroInset p={2}>
                  <video
                    src={post.video}
                    controls
                    autoPlay
                    loop
                    muted
                    width="100%"
                    style={{
                      display: 'block',
                      maxHeight: '400px',
                      objectFit: 'contain',
                      background: 'black',
                    }}
                  />
                </RetroInset>
              ) : null}

              {post.sections?.map((section, index) => (
                <RetroInset key={`${post.slug}-section-${index}`} p={{ base: 4, md: 5 }}>
                  <Heading
                    as="h2"
                    size="md"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={3}
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                  >
                    {section.heading}
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    {section.paragraphs?.map((paragraph, paragraphIndex) => (
                      <Text
                        key={`${post.slug}-section-${index}-p-${paragraphIndex}`}
                        color="var(--cg-muted)"
                        lineHeight="1.8"
                        fontSize={{ base: 'sm', md: 'md' }}
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {paragraph}
                      </Text>
                    ))}
                    {section.bullets?.length ? (
                      <UnorderedList
                        color="var(--cg-text)"
                        spacing={2}
                        pl={4}
                        fontFamily="var(--cg-font-retro-display)"
                        sx={{ '& li::marker': { color: 'var(--cg-link)' } }}
                      >
                        {section.bullets.map((bullet, bulletIndex) => (
                          <ListItem
                            key={`${post.slug}-section-${index}-li-${bulletIndex}`}
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            {bullet}
                          </ListItem>
                        ))}
                      </UnorderedList>
                    ) : null}
                  </VStack>
                </RetroInset>
              ))}

              {post.faqs?.length ? (
                <RetroInset mt={4} p={{ base: 4, md: 5 }}>
                  <Heading
                    as="h2"
                    size="md"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={3}
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                  >
                    Frequently Asked Questions
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    {post.faqs.map((faq, index) => (
                      <Box key={`${post.slug}-faq-${index}`}>
                        <Heading
                          as="h3"
                          size="sm"
                          color="var(--cg-text)"
                          mb={2}
                          fontFamily="var(--cg-font-retro-display)"
                          textTransform="uppercase"
                          letterSpacing="0.05em"
                        >
                          {faq.question}
                        </Heading>
                        <Text
                          color="var(--cg-muted)"
                          lineHeight="1.8"
                          fontSize={{ base: 'sm', md: 'md' }}
                          fontFamily="var(--cg-font-retro-display)"
                        >
                          {faq.answer}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </RetroInset>
              ) : null}

              {post.relatedPages?.length ? (
                <RetroInset mt={4} p={{ base: 4, md: 5 }}>
                  <Heading
                    as="h2"
                    size="sm"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    mb={3}
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                  >
                    Related on CodeGrind
                  </Heading>
                  <VStack align="stretch" spacing={2}>
                    {post.relatedPages.map((related) => (
                      <Link
                        as={RouterLink}
                        key={related.path}
                        to={related.path}
                        color="var(--cg-link)"
                        fontFamily="var(--cg-font-retro-display)"
                        _hover={{ textDecoration: 'underline', color: 'var(--cg-link-active)' }}
                      >
                        {related.label}
                      </Link>
                    ))}
                  </VStack>
                </RetroInset>
              ) : null}

              <RetroInset mt={2} p={{ base: 4, md: 5 }}>
                <VStack align="stretch" spacing={3}>
                  <Heading
                    as="h3"
                    size="sm"
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                  >
                    Try it yourself
                  </Heading>
                  <Text
                    color="var(--cg-muted)"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="1.7"
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    The Hello World tower defense demo runs right on the home page. No signup, no
                    install, just open it and play.
                  </Text>
                  <HStack spacing={3} flexWrap="wrap">
                    <Button
                      as={RouterLink}
                      to="/"
                      size={{ base: 'sm', md: 'md' }}
                      {...retroButtonProps}
                    >
                      Play the Free Demo
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/games/tower-defense"
                      size={{ base: 'sm', md: 'md' }}
                      {...retroButtonProps}
                    >
                      Browse Tower Defense Levels
                    </Button>
                  </HStack>
                </VStack>
              </RetroInset>
            </VStack>
          </RetroPanel>
        </VStack>
      </Container>
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={4} pb={10}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default NativeBlogPostPage;
