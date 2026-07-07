import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Divider,
  Heading,
  Link as ChakraLink,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';
import { getPrerenderRouteDetails } from '../../prerenderRoutes';
import { getSupportEmail } from '../../constants/supportEmail';

const accordionStyles = {
  '& .chakra-accordion__item': {
    border: '2px solid var(--cg-window-shadow)',
    borderColor: 'var(--cg-window-shadow) !important',
    marginBottom: '12px',
    background: 'var(--cg-window-face)',
    boxShadow: 'var(--cg-window-outset)',
  },
  '& .chakra-accordion__button': {
    background: 'rgba(255,255,255,0.14)',
    color: 'var(--cg-text)',
    fontFamily: 'var(--cg-font-retro-display)',
    fontSize: { base: 'sm', md: 'md' },
  },
  '& .chakra-accordion__button:hover': {
    background: 'rgba(255,255,255,0.24) !important',
  },
  '& .chakra-accordion__button > div': {
    color: 'var(--cg-text) !important',
    fontFamily: 'var(--cg-font-retro-display) !important',
    fontSize: 'inherit !important',
    letterSpacing: '0.03em',
  },
  '& .chakra-accordion__panel': {
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--cg-text) !important',
    fontFamily: 'var(--cg-font-retro-display) !important',
    fontSize: { base: 'sm', md: 'md' },
    lineHeight: '1.7',
  },
  '& .chakra-accordion__icon': {
    color: 'var(--cg-link)',
  },
  '& a': {
    color: 'var(--cg-link)',
    fontWeight: '700',
  },
};

const FAQPage = () => {
  const route = getPrerenderRouteDetails('/faq');

  return (
    <PageTemplate title="FAQ" showGiphyBackground>
      <PageSeo
        title={route.title}
        description={route.description}
        path={route.path}
        keywords={route.keywords}
      />
      {/* Top banner ad */}
      <Box
        width="100%"
        maxWidth={{ base: '100%', md: '728px' }}
        mx="auto"
        mt={{ base: 3, md: 4 }}
        mb={{ base: 5, md: 6 }}
        px={{ base: 4, md: 0 }}
      >
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      {/* Content with sidebar layout */}
      <Box width="100%" display="flex" flexDirection={{ base: 'column', lg: 'row' }}>
        {/* Left sidebar ad - only visible on desktop */}
        <Box
          width={{ base: '100%', lg: '250px' }}
          mr={{ base: 0, lg: 6 }}
          mb={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
          position="relative"
        >
          <SidebarAd slotId={adSlots.generic.sidebar} />
        </Box>

        {/* Main content */}
        <Box flex="1" width="100%">
          <Container
            maxW="container.lg"
            width="100%"
            px={{ base: 4, md: 6 }}
            pb={{ base: 12, md: 20 }}
          >
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
              <Box className="cg-panel-window" overflow="hidden" mt={{ base: 6, md: 10 }}>
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    faq.txt
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)" textAlign="center">
                  <Heading
                    as="h1"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize={{ base: '2xl', md: '3xl' }}
                    color="var(--cg-text)"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    mb={{ base: 3, md: 4 }}
                  >
                    FAQ & Help
                  </Heading>
                  <Divider borderColor="var(--cg-window-dark)" />
                </Box>
              </Box>

              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    Need help fast?
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Text
                    color="var(--cg-text)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize={{ base: 'sm', md: 'md' }}
                    sx={{ '& a': { color: 'var(--cg-link)', fontWeight: '700' } }}
                  >
                    Email me at{' '}
                    <ChakraLink href={`mailto:${getSupportEmail('info')}`}>
                      {getSupportEmail('info')}
                    </ChakraLink>{' '}
                    and include your account email, a short description, and (if billing-related)
                    the date of purchase.
                  </Text>
                </Box>
              </Box>

              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    Billing & Subscriptions
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Accordion allowToggle sx={accordionStyles}>
                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            I subscribed and need a refund — what’s the policy?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Email{' '}
                        <ChakraLink href={`mailto:${getSupportEmail('billing')}`}>
                          {getSupportEmail('billing')}
                        </ChakraLink>{' '}
                        with your account email and purchase date. You can cancel anytime from{' '}
                        <ChakraLink as={RouterLink} to="/pricing">
                          Upgrade
                        </ChakraLink>{' '}
                        or{' '}
                        <ChakraLink as={RouterLink} to="/profile">
                          Profile
                        </ChakraLink>{' '}
                        to stop future charges.
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            My subscription isn’t showing — what should I do?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Log out/in, then check{' '}
                        <ChakraLink as={RouterLink} to="/profile">
                          Profile
                        </ChakraLink>
                        . If it still doesn’t show, email support with your account email and
                        receipt date.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </Box>

              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    Discord Linking
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Accordion allowToggle sx={accordionStyles}>
                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            How do I link my Discord account?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Go to{' '}
                        <ChakraLink as={RouterLink} to="/profile">
                          Profile
                        </ChakraLink>{' '}
                        and click LINK.DISCORD. If already linked, it shows DISCORD.LINKED.
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            I can’t link Discord — what should I check?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Check pop-ups and confirm the correct Discord account. If it still fails,
                        email support with a screenshot.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </Box>

              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    Learning Paths
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Accordion allowToggle sx={accordionStyles}>
                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            How does the learning path work?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        Each learning path node is a short mission (lesson + task + game beat).
                        Clear prerequisites to unlock the next nodes.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </Box>

              <Box className="cg-panel-window" overflow="hidden">
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    Account
                  </Text>
                </Box>
                <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                  <Accordion allowToggle sx={accordionStyles}>
                    <AccordionItem borderColor="rgba(0, 255, 255, 0.2)">
                      <h3>
                        <AccordionButton
                          _hover={{ bg: 'rgba(0,255,255,0.08)' }}
                          py={{ base: 3, md: 4 }}
                          px={{ base: 3, md: 4 }}
                        >
                          <Box
                            flex="1"
                            textAlign="left"
                            fontFamily="monospace"
                            fontSize={{ base: 'sm', md: 'md' }}
                          >
                            How do I delete my account?
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h3>
                      <AccordionPanel
                        pb={4}
                        color="gray.200"
                        fontFamily="monospace"
                        fontSize={{ base: 'sm', md: 'md' }}
                      >
                        On the{' '}
                        <ChakraLink as={RouterLink} to="/profile">
                          Profile
                        </ChakraLink>{' '}
                        page, click DELETE.ACCOUNT. Follow the prompts to confirm. This is
                        irreversible, so be sure before proceeding.
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </Box>
            </VStack>
          </Container>
        </Box>
      </Box>

      <Box
        width="100%"
        maxWidth={{ base: '100%', md: '728px' }}
        mx="auto"
        mt={{ base: 5, md: 6 }}
        mb={{ base: 8, md: 10 }}
        px={{ base: 4, md: 0 }}
      >
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
};

export default FAQPage;
