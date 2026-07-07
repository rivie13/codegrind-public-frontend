import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Image,
  Input,
  Link,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import PageTemplate from '../../components/layout/PageTemplate';
import { RetroInset, RetroPanel } from '../../components/retro/RetroPageShell';
import PageSeo from '../../components/seo/PageSeo';
import adSlots from '../../config/adSlots';
import { fetchBlogFeed } from '../../services/blogService';
import { getPublishedNativeBlogPosts } from '../../data/nativeBlogPosts';

const FEATURED_CATEGORY = 'CodeGrind';
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

function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const nativePosts = getPublishedNativeBlogPosts();

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      try {
        const entries = await fetchBlogFeed();
        if (!isMounted) return;
        setPosts(entries);
        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Unable to load blog posts.');
        setStatus('error');
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = posts.filter((post) => post.categories.includes(FEATURED_CATEGORY));

  return (
    <PageTemplate showGiphyBackground>
      <PageSeo
        title="CodeGrind Blog: Coding Practice, Interview Prep, and Gamified Learning"
        description="Original CodeGrind articles on coding interview practice, gamified DSA training, and how Code Breach fits into the broader CodeGrind platform, plus a syndicated feed of related posts."
        path="/blog"
        keywords="codegrind blog, coding interview prep blog, gamified coding learning, dsa practice articles"
      />
      <Box width="100%" maxWidth="728px" mx="auto" mt={4} mb={6}>
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>
      <Container maxW="container.lg" pt={{ base: 8, md: 10 }} pb={{ base: 16, md: 28 }}>
        <VStack spacing={{ base: 5, md: 6 }} align="stretch">
          <RetroPanel
            fileLabel="blog-feed.exe"
            title="CodeGrind Blog"
            subtitle="Live feed of public CodeGrind articles."
            bodyProps={{ textAlign: 'center' }}
          />

          <RetroPanel
            fileLabel="categories.cfg"
            title="Browse CodeGrind Posts"
            subtitle="Follow the public archive and syndicated feed from one place."
          >
            <HStack spacing={3} flexWrap="wrap" align={{ base: 'flex-start', md: 'center' }}>
              <Badge {...retroBadgeProps}>Categories</Badge>
              <Link
                href="https://rivie13.github.io/categories/CodeGrind"
                isExternal
                color="var(--cg-link)"
                fontFamily="var(--cg-font-retro-display)"
                _hover={{ textDecoration: 'underline', color: 'var(--cg-link-active)' }}
                fontSize={{ base: 'sm', md: 'md' }}
              >
                Browse all CodeGrind posts
              </Link>
            </HStack>
          </RetroPanel>

          {nativePosts.length > 0 && (
            <RetroPanel
              fileLabel="originals.db"
              title="CodeGrind Originals"
              subtitle="Written on CodeGrind and indexable by search engines."
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                {nativePosts.map((post) => (
                  <Box key={post.slug} className="cg-panel-window" overflow="hidden">
                    <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" noOfLines={1}>
                        original-post.md
                      </Text>
                      <Text fontSize="10px" fontWeight="700">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : 'Draft'}
                      </Text>
                    </Box>
                    <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                      <VStack align="start" spacing={3}>
                        {post.heroImage ? (
                          <RetroInset width="100%" p={2}>
                            <Image
                              src={post.heroImage}
                              alt={post.title}
                              objectFit="cover"
                              w="100%"
                              maxH={{ base: '160px', md: '180px' }}
                            />
                          </RetroInset>
                        ) : null}
                        <HStack spacing={2} flexWrap="wrap">
                          <Badge {...retroBadgeProps}>Original</Badge>
                          {post.publishedAt ? (
                            <Badge {...retroBadgeProps}>
                              {new Date(post.publishedAt).toLocaleDateString()}
                            </Badge>
                          ) : null}
                        </HStack>
                        <Heading
                          size="md"
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize={{ base: 'lg', md: 'md' }}
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                        >
                          {post.title}
                        </Heading>
                        <Text
                          color="var(--cg-muted)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize={{ base: 'sm', md: 'md' }}
                        >
                          {post.description}
                        </Text>
                        <Link
                          as={RouterLink}
                          to={`/blog/codegrind/${post.slug}`}
                          color="var(--cg-link)"
                          fontWeight="700"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize={{ base: 'sm', md: 'md' }}
                          _hover={{ textDecoration: 'underline', color: 'var(--cg-link-active)' }}
                        >
                          Open article
                        </Link>
                      </VStack>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </RetroPanel>
          )}

          {/* Mailchimp Signup Form */}
          <RetroPanel
            fileLabel="newsletter.frm"
            title="Stay Updated With CodeGrind"
            subtitle="Subscribe for new blog posts, CodeGrind updates, and upcoming projects. No spam, just useful release notes."
            bodyProps={{ maxW: '600px', mx: 'auto', width: '100%' }}
          >
            <Box id="mc_embed_signup">
              <form
                action="https://github.us14.list-manage.com/subscribe/post?u=4c5f3cb9e9f5dfc6c64a01f23&amp;id=28ff2a557d&amp;f_id=00c351e0f0"
                method="post"
                id="mc-embedded-subscribe-form"
                name="mc-embedded-subscribe-form"
                className="validate"
                target="_blank"
                noValidate
              >
                <VStack spacing={4} id="mc_embed_signup_scroll">
                  <Box className="mc-field-group" width="100%">
                    <label
                      htmlFor="mce-EMAIL"
                      style={{
                        fontWeight: '700',
                        color: 'var(--cg-text)',
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontFamily: 'var(--cg-font-retro-display)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Email Address <span style={{ color: '#8f1f1f' }}>*</span>
                    </label>
                    <Input
                      type="email"
                      name="EMAIL"
                      className="required email"
                      id="mce-EMAIL"
                      required
                      placeholder="your.email@example.com"
                      _placeholder={{ color: 'var(--cg-muted)' }}
                      bg="var(--cg-window-face)"
                      borderColor="var(--cg-window-dark)"
                      borderRadius="0"
                      boxShadow="var(--cg-window-inset)"
                      _hover={{ borderColor: 'var(--cg-window-dark)' }}
                      _focus={{
                        borderColor: 'var(--cg-link)',
                        boxShadow: 'var(--cg-window-inset)',
                      }}
                      color="var(--cg-text)"
                      height={{ base: '44px', md: '40px' }}
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontFamily="var(--cg-font-retro-display)"
                    />
                  </Box>
                  <Box id="mce-responses" className="clear foot" width="100%">
                    <Box
                      className="response"
                      id="mce-error-response"
                      style={{
                        display: 'none',
                        color: '#8f1f1f',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem',
                      }}
                    ></Box>
                    <Box
                      className="response"
                      id="mce-success-response"
                      style={{
                        display: 'none',
                        color: '#0f6f17',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem',
                      }}
                    ></Box>
                  </Box>
                  <Box style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                    <input
                      type="text"
                      color="black"
                      name="b_4c5f3cb9e9f5dfc6c64a01f23_28ff2a557d"
                      tabIndex={-1}
                      defaultValue=""
                    />
                  </Box>
                  <Box className="optionalParent" width="100%">
                    <Box className="clear foot">
                      <Button
                        type="submit"
                        name="subscribe"
                        id="mc-embedded-subscribe"
                        width="100%"
                        bg="var(--cg-window-face)"
                        color="var(--cg-text)"
                        border="1px solid var(--cg-window-dark)"
                        borderRadius="0"
                        boxShadow="var(--cg-window-outset)"
                        _hover={{ bg: 'var(--cg-panel-shell)' }}
                        _active={{ boxShadow: 'var(--cg-window-inset)' }}
                        height={{ base: '44px', md: '40px' }}
                        fontSize={{ base: 'sm', md: 'md' }}
                        fontFamily="var(--cg-font-retro-display)"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        Subscribe
                      </Button>
                      <Text
                        mt={3}
                        textAlign="center"
                        fontSize="xs"
                        color="var(--cg-muted)"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Powered by{' '}
                        <Link
                          href="http://eepurl.com/jdZ9VY"
                          title="Mailchimp - email marketing made easy and fun"
                          isExternal
                          color="var(--cg-link)"
                        >
                          Mailchimp
                        </Link>
                      </Text>
                    </Box>
                  </Box>
                </VStack>
              </form>
            </Box>
          </RetroPanel>

          {status === 'loading' && (
            <RetroPanel fileLabel="feed-loader.sys" title="Loading Blog Feed">
              <Box textAlign="center" py={4}>
                <Spinner size="xl" color="var(--cg-link)" />
                <Text mt={3} color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)">
                  Loading blog posts...
                </Text>
              </Box>
            </RetroPanel>
          )}

          {status === 'error' && (
            <RetroPanel fileLabel="feed-error.log" title="Blog Feed Error">
              <Alert
                status="error"
                bg="rgba(255,255,255,0.14)"
                borderColor="#8f1f1f"
                borderWidth="2px"
                color="var(--cg-text)"
              >
                <AlertIcon color="#8f1f1f" />
                {error || 'Unable to load blog posts.'}
              </Alert>
            </RetroPanel>
          )}

          {status === 'ready' && (
            <RetroPanel
              fileLabel="featured-feed.log"
              title="Featured Feed"
              subtitle="CodeGrind-tagged posts from the public blog archive."
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }}>
                {filteredPosts.map((post) => (
                  <Box key={post.link} className="cg-panel-window" overflow="hidden">
                    <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" noOfLines={1}>
                        feed-entry.html
                      </Text>
                      <Text fontSize="10px" fontWeight="700">
                        {post.published ? new Date(post.published).toLocaleDateString() : 'New'}
                      </Text>
                    </Box>
                    <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                      <VStack align="start" spacing={3}>
                        {post.thumbnail && (
                          <RetroInset width="100%" p={2}>
                            <Image
                              src={post.thumbnail}
                              alt={post.title}
                              objectFit="cover"
                              w="100%"
                              maxH={{ base: '160px', md: '180px' }}
                            />
                          </RetroInset>
                        )}
                        <Badge {...retroBadgeProps}>
                          {post.published ? new Date(post.published).toLocaleDateString() : 'New'}
                        </Badge>
                        <Heading
                          size="md"
                          color="var(--cg-text)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize={{ base: 'lg', md: 'md' }}
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                        >
                          {post.title}
                        </Heading>
                        <Text
                          color="var(--cg-muted)"
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize={{ base: 'sm', md: 'md' }}
                        >
                          {post.summary}
                        </Text>
                        <HStack spacing={3} flexWrap="wrap" rowGap={2}>
                          <Link
                            as={RouterLink}
                            to={post.internalPath || '/blog'}
                            color="var(--cg-link)"
                            fontWeight="700"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize={{ base: 'sm', md: 'md' }}
                            _hover={{ textDecoration: 'underline', color: 'var(--cg-link-active)' }}
                          >
                            Open article
                          </Link>
                          <Link
                            href={post.link}
                            isExternal
                            color="var(--cg-muted)"
                            fontSize={{ base: 'xs', md: 'sm' }}
                            fontFamily="var(--cg-font-retro-display)"
                          >
                            View on blog
                          </Link>
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
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

export default BlogPage;
