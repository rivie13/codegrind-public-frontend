import { ArrowBackIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  HStack,
  Image,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link as RouterLink, useParams } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import adSlots from '../../config/adSlots';
import { fetchBlogFeed, getBlogBaseUrl } from '../../services/blogService';

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

const buildPostPath = (year, month, day, slug) => `/blog/${year}/${month}/${day}/${slug}`;

const normalizeHtml = (rawHtml) => {
  if (!rawHtml) return '';
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  doc.querySelectorAll('script, style').forEach((node) => node.remove());

  doc.querySelectorAll('[src]').forEach((node) => {
    const src = node.getAttribute('src');
    if (src && src.startsWith('/')) {
      node.setAttribute('src', `${getBlogBaseUrl()}${src}`);
    }
  });

  doc.querySelectorAll('a[href]').forEach((node) => {
    const href = node.getAttribute('href');
    if (href && href.startsWith('/')) {
      node.setAttribute('href', `${getBlogBaseUrl()}${href}`);
    }
  });

  return DOMPurify.sanitize(doc.body.innerHTML, { USE_PROFILES: { html: true } });
};

function BlogPostPage() {
  const { year, month, day, slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const postPath = useMemo(() => buildPostPath(year, month, day, slug), [year, month, day, slug]);

  useEffect(() => {
    let isMounted = true;

    const loadPost = async () => {
      try {
        const entries = await fetchBlogFeed();
        const match = entries.find((entry) => entry.internalPath === postPath);
        if (!isMounted) return;
        if (match) {
          setPost(match);
          setStatus('ready');
          return;
        }
        setStatus('missing');
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Unable to load blog post.');
        setStatus('error');
      }
    };

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [postPath]);

  const sanitizedContent = useMemo(() => normalizeHtml(post?.contentHtml || ''), [post]);

  return (
    <PageTemplate>
      <Helmet>
        <title>
          {post?.title ? `${post.title} | CodeGrind Blog` : 'CodeGrind Blog | CodeGrind Blog'}
        </title>
        {post?.link ? <link rel="canonical" href={post.link} /> : null}
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>
      <Container maxW="container.lg" py={{ base: 6, md: 10 }}>
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

          {status === 'loading' && (
            <RetroPanel fileLabel="article-loader.sys" title="Loading Article">
              <Box textAlign="center" py={8}>
                <Spinner size="xl" color="var(--cg-link)" />
                <Text mt={3} color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                  Loading article...
                </Text>
              </Box>
            </RetroPanel>
          )}

          {status === 'error' && (
            <RetroPanel fileLabel="article-error.log" title="Article Error">
              <Alert
                status="error"
                bg="rgba(255,255,255,0.14)"
                borderColor="#8f1f1f"
                borderWidth="2px"
                color="var(--cg-text)"
              >
                <AlertIcon color="#8f1f1f" />
                {error || 'Unable to load article.'}
              </Alert>
            </RetroPanel>
          )}

          {status === 'missing' && (
            <RetroPanel fileLabel="article-missing.log" title="Article Unavailable">
              <Alert
                status="warning"
                bg="rgba(255,255,255,0.14)"
                borderColor="#6f5600"
                borderWidth="2px"
                color="var(--cg-text)"
              >
                <AlertIcon color="#6f5600" />
                This article is not available in the feed. You can read it on the blog site.
              </Alert>
            </RetroPanel>
          )}

          {post && status === 'ready' && (
            <RetroPanel
              fileLabel="syndicated-article.html"
              title={post.title}
              subtitle="Syndicated CodeGrind-tagged article from the public blog archive."
              titlebarActions={<Badge {...retroBadgeProps}>CodeGrind Blog</Badge>}
            >
              <VStack align="stretch" spacing={{ base: 4, md: 5 }}>
                <HStack spacing={3} flexWrap="wrap" align={{ base: 'flex-start', md: 'center' }}>
                  <Badge {...retroBadgeProps}>
                    {new Date(post.published || post.updated).toLocaleDateString()}
                  </Badge>
                  <Link
                    href={post.link}
                    isExternal
                    color="var(--cg-link)"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontFamily="var(--cg-font-retro-display)"
                  >
                    View on Blog <ExternalLinkIcon mx="2px" />
                  </Link>
                </HStack>

                {post.thumbnail && (
                  <RetroInset p={2}>
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      maxH={{ base: '200px', md: '320px' }}
                      objectFit="cover"
                      w="100%"
                    />
                  </RetroInset>
                )}

                <RetroInset p={{ base: 4, md: 5 }}>
                  <Alert
                    status="info"
                    bg="rgba(255,255,255,0.14)"
                    borderColor="var(--cg-link)"
                    borderWidth="2px"
                    color="var(--cg-text)"
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    <AlertIcon color="var(--cg-link)" />
                    Interactive demos and inputs are available on the blog site only.
                  </Alert>
                </RetroInset>

                <Box
                  className="blog-post-content"
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  lineHeight={{ base: '1.7', md: '1.8' }}
                  fontSize={{ base: 'sm', md: 'md' }}
                  sx={{
                    '& h1, & h2, & h3, & h4, & h5': {
                      color: 'var(--cg-text)',
                      marginTop: '1.5rem',
                      marginBottom: '0.75rem',
                      fontFamily: 'var(--cg-font-retro-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    },
                    '& h1': { fontSize: { base: '1.6rem', md: '2rem' } },
                    '& h2': { fontSize: { base: '1.35rem', md: '1.6rem' } },
                    '& h3': { fontSize: { base: '1.15rem', md: '1.35rem' } },
                    '& a': {
                      color: 'var(--cg-link)',
                      textDecoration: 'underline',
                    },
                    '& img': {
                      borderRadius: '0',
                      border: '2px solid var(--cg-window-dark)',
                      background: 'rgba(255,255,255,0.08)',
                      boxShadow: 'var(--cg-window-inset)',
                      padding: '4px',
                      marginTop: '1rem',
                      marginBottom: '1rem',
                      maxWidth: '100%',
                      height: 'auto',
                    },
                    '& iframe, & video': {
                      maxWidth: '100%',
                    },
                    '& select, & input, & textarea, & button': {
                      display: 'none',
                    },
                    '& pre': {
                      background: 'var(--cg-window-face)',
                      border: '2px solid var(--cg-window-dark)',
                      boxShadow: 'var(--cg-window-inset)',
                      padding: '1rem',
                      overflowX: 'auto',
                    },
                    '& pre code': {
                      whiteSpace: 'pre',
                      fontSize: '0.9em',
                    },
                    '& code': {
                      fontFamily: 'var(--cg-font-retro-terminal)',
                    },
                    '& ul, & ol': {
                      paddingLeft: { base: '1.1rem', md: '1.5rem' },
                    },
                    '& li::marker': {
                      color: 'var(--cg-link)',
                    },
                    '& blockquote': {
                      borderLeft: '3px solid var(--cg-link)',
                      background: 'rgba(255,255,255,0.08)',
                      paddingLeft: '1rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      color: 'var(--cg-text)',
                    },
                    '& table': {
                      display: 'block',
                      width: '100%',
                      overflowX: 'auto',
                    },
                    '& p': {
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </VStack>
            </RetroPanel>
          )}
        </VStack>
      </Container>
      <Box width="100%" maxWidth="728px" mx="auto" mt={6} mb={4} pb={10}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default BlogPostPage;
