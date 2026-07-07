import {
  Box,
  Container,
  Divider,
  Heading,
  Link,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import SidebarAd from '../../components/ads/SidebarAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';
import { getPrerenderRouteDetails } from '../../prerenderRoutes';
import { getSupportEmail } from '../../constants/supportEmail';

function PolicySection({ title, children }) {
  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          {title}
        </Text>
      </Box>
      <Box
        p={{ base: 4, md: 5 }}
        bg="rgba(255,255,255,0.14)"
        sx={{
          '& p': {
            color: 'var(--cg-text)',
            fontFamily: 'var(--cg-font-retro-display)',
            fontSize: { base: 'sm', md: 'md' },
            lineHeight: { base: '1.7', md: '1.8' },
          },
          '& li': {
            color: 'var(--cg-text)',
            fontFamily: 'var(--cg-font-retro-display)',
            fontSize: { base: 'sm', md: 'md' },
            lineHeight: { base: '1.7', md: '1.8' },
          },
          '& li::marker': {
            color: 'var(--cg-link)',
          },
          '& a': {
            color: 'var(--cg-link)',
            fontWeight: '700',
            wordBreak: 'break-word',
          },
          '& strong': {
            color: 'var(--cg-text)',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function PrivacyPolicyPage() {
  const route = getPrerenderRouteDetails('/privacy-policy');

  return (
    <PageTemplate title="PRIVACY POLICY & YOUR DATA">
      <PageSeo
        title={route.title}
        description={route.description}
        path={route.path}
        keywords={route.keywords}
      />
      {/* Top banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" px={{ base: 4, md: 0 }} mt={4} mb={6}>
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
        <Box flex="1">
          <Container maxW="container.lg" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
            <VStack spacing={{ base: 6, md: 10 }} align="stretch" wordBreak="break-word">
              <Box className="cg-panel-window" overflow="hidden" mt={{ base: 6, md: 10 }}>
                <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                    privacy-policy.txt
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
                    Privacy Policy & Your Data
                  </Heading>
                  <Text
                    color="var(--cg-muted)"
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize={{ base: 'sm', md: 'md' }}
                    mb={{ base: 3, md: 4 }}
                  >
                    How CodeGrind handles sign-in, session data, billing metadata, analytics, and
                    support contact details.
                  </Text>
                  <Divider borderColor="var(--cg-window-dark)" />
                </Box>
              </Box>

              <PolicySection title="How Google Sign-In Is Used">
                <Text mb={3}>
                  CodeGrind supports Google Sign-In as an account authentication option. If you
                  choose Google Sign-In, CodeGrind uses the Google account email address and the
                  Google account identifier returned during authentication to create your CodeGrind
                  account, sign you in, or link Google Sign-In to an existing CodeGrind account.
                </Text>
                <Text>
                  That Google account data is used only for authentication, account linking, and
                  account security inside CodeGrind.
                </Text>
              </PolicySection>

              <PolicySection title="Information We Collect">
                <Text mb={3}>
                  At CodeGrind, we are committed to protecting your privacy. We collect the
                  following information:
                </Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }} mb={4}>
                  <ListItem>
                    Account details such as email address, username, and (if you set one) a hashed
                    password
                  </ListItem>
                  <ListItem>Profile details you choose to provide (avatar, bio)</ListItem>
                  <ListItem>
                    OAuth identifiers for login providers you use (e.g., Google or Discord IDs)
                  </ListItem>
                  <ListItem>
                    Code submissions, problem content you create, and related stats (progress,
                    leaderboards, achievements)
                  </ListItem>
                  <ListItem>
                    Usage data like chat usage/refinement counts, attempts, solves, XP/level
                    progression, and rate-limit records
                  </ListItem>
                  <ListItem>
                    Session/security data (session IDs, verification tokens, pending email changes)
                  </ListItem>
                  <ListItem>
                    Guest session data (hashed guest token, hashed IP and user-agent for abuse
                    prevention)
                  </ListItem>
                  <ListItem>
                    Billing metadata such as Stripe customer/subscription IDs, status, and
                    membership tier
                  </ListItem>
                  <ListItem>
                    Discord community data when you connect (Discord user ID, username, global name,
                    avatar hash, guild status, opt-in preferences)
                  </ListItem>
                </UnorderedList>
                <Text>
                  We do not collect personally identifiable information such as your name, date of
                  birth, address EVER. Unless you use your name or other personal details in your
                  username, email or profile bio, in which case that information is voluntarily
                  shared by you and visible to other users (username and profile bio).
                </Text>
              </PolicySection>

              <PolicySection title="Discord Sign-In and Community Features">
                <Text mb={3}>
                  If you choose to connect or sign in with Discord, we request access to basic
                  Discord account data and server membership status. This allows us to link your
                  CodeGrind profile and power Discord community features.
                </Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }} mb={4}>
                  <ListItem>Discord user ID, username, and global name (if set)</ListItem>
                  <ListItem>Discord avatar hash (used to display your Discord avatar)</ListItem>
                  <ListItem>
                    Email address from Discord (only if your Discord account provides one)
                  </ListItem>
                  <ListItem>Guild membership status and opt-in settings for announcements</ListItem>
                </UnorderedList>
                <Text mb={3}>
                  We use this information to link your account, show your Discord profile on
                  CodeGrind (when connected), and (if you opt in and are in the guild) post
                  announcements such as solves, level-ups, and achievements.
                </Text>
                <Text mb={3}>
                  If you use Discord tournament or challenge features, we may store Discord user IDs
                  for invites/participants and Discord message or thread IDs for those events.
                </Text>
                <Text>
                  If you use the Discord AI Q&A bot, we process your message content to generate a
                  response and store rate-limit counters keyed to Discord user IDs to prevent abuse.
                </Text>
              </PolicySection>

              <PolicySection title="Google Sign-In Information">
                <Text mb={3}>
                  For users who choose to sign in using Google, we only request and collect:
                </Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }} mb={4}>
                  <ListItem>Your Google email address</ListItem>
                  <ListItem>
                    Basic profile information (limited to what&apos;s necessary for account
                    creation)
                  </ListItem>
                </UnorderedList>
                <Text>
                  We do not request or have access to any additional Google account information,
                  other Google services, or extended permissions. The collected information is used
                  solely for account authentication and communication purposes.
                </Text>
              </PolicySection>

              <PolicySection title="How We Use Your Information">
                <Text mb={3}>The information we collect is used to:</Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }}>
                  <ListItem>Provide and improve our services</ListItem>
                  <ListItem>Authenticate users and maintain user accounts</ListItem>
                  <ListItem>Track coding progress and display statistics</ListItem>
                  <ListItem>Generate leaderboards and other community features</ListItem>
                </UnorderedList>
              </PolicySection>

              <PolicySection title="AI Features and Diagnostic Logs">
                <Text mb={3}>
                  When you use AI features (e.g., hints, refinements, AI problem generation, or
                  Discord AI Q&amp;A), we process your prompts, code, and related context to
                  generate responses. This content may be sent to third-party AI providers to
                  fulfill your request.
                </Text>
                <Text>
                  For reliability and abuse prevention, we may log diagnostic data such as prompt
                  previews, code snippets, request timing, and error details. Logs are used for
                  debugging and performance monitoring.
                </Text>
              </PolicySection>

              <PolicySection title="Guest Sessions">
                <Text mb={3}>
                  If you use CodeGrind without an account, we issue a guest token so you can access
                  limited features. We store a hashed version of the guest token plus hashed IP and
                  user-agent values to help prevent abuse.
                </Text>
                <Text>
                  Guest data is tied to usage limits (e.g., chat/refinement usage) and expires after
                  a short period.
                </Text>
              </PolicySection>

              <PolicySection title="Payment Information">
                <Text>
                  CodeGrind uses Stripe to handle all payment processing. When you make a purchase,
                  you transfer to a Stripe hosted page where your payment information is securely
                  transmitted directly to Stripe. We do not store or have access to your credit card
                  details or banking information. We do keep stripe related information such as
                  subscription status, membership tier.
                </Text>
              </PolicySection>

              <PolicySection title="Cookies and Advertising">
                <Text mb={3}>
                  We use cookies to enhance your experience on our website. Additionally, we work
                  with third-party vendors, including Google, who may use cookies to serve ads based
                  on your prior visits to our website or other websites.
                </Text>
                <Text mb={3}>
                  We also use essential cookies or similar local storage to keep you signed in,
                  maintain sessions, and remember preferences (such as consent choices).
                </Text>
                <Text mb={3}>
                  Google&apos;s use of advertising cookies enables it and its partners to serve ads
                  to our users based on their visit to our site and/or other sites on the Internet.
                </Text>
                <Text>
                  You may opt out of personalized advertising by visiting{' '}
                  <Link href="https://www.google.com/settings/ads" isExternal>
                    Google&apos;s Ads Settings
                  </Link>
                  . Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for
                  personalized advertising by visiting{' '}
                  <Link href="https://www.aboutads.info" isExternal>
                    www.aboutads.info
                  </Link>
                  .
                </Text>
              </PolicySection>

              <PolicySection title="Data Security">
                <Text>
                  We implement reasonable security measures to protect your personal information
                  from unauthorized access, alteration, disclosure, or destruction. However, no
                  method of electronic storage or transmission over the Internet is 100% secure, and
                  we cannot guarantee absolute security. Including but not limited to salting and
                  hashing of passwords, regular security audits, and using secure protocols for data
                  transmission. We continuously monitor and update our security practices to
                  safeguard your information.
                </Text>
              </PolicySection>

              <PolicySection title="Changes to This Privacy Policy">
                <Text>
                  We may update our Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page. You are advised to review
                  this Privacy Policy periodically for any changes.
                </Text>
              </PolicySection>

              <PolicySection title="Contact Us">
                <Text>
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <Link href={`mailto:${getSupportEmail('info')}`}>{getSupportEmail('info')}</Link>.
                </Text>
              </PolicySection>

              <PolicySection title="Analytics and Tracking">
                <Text mb={3}>
                  To understand how our visitors engage with CodeGrind and to improve our services,
                  we use Google Analytics. Google Analytics collects information anonymously, such
                  as:
                </Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }} mb={4}>
                  <ListItem>The pages you visit on our site</ListItem>
                  <ListItem>The time you spend on each page</ListItem>
                  <ListItem>The type of browser and operating system you use</ListItem>
                  <ListItem>Your general geographic location (e.g., country or city)</ListItem>
                  <ListItem>
                    How you arrived at our site (e.g., directly, from a search engine, or from a
                    referring link)
                  </ListItem>
                </UnorderedList>
                <Text mb={3}>
                  This data is aggregated and does not personally identify you. We use this
                  information to analyze site traffic, understand user behavior, and enhance the
                  user experience on CodeGrind.
                </Text>
                <Text mb={3}>
                  You have several options to control or opt-out of Google Analytics tracking:
                </Text>
                <UnorderedList spacing={2} pl={{ base: 4, md: 5 }} mb={4}>
                  <ListItem>
                    <strong>Cookie Consent Banner:</strong> You can decline analytics tracking by
                    selecting &quot;Deny&quot; on the cookie consent banner that appears when you
                    first visit our site. If you have previously accepted, you can typically clear
                    your cookies for this site in your browser settings to see the banner again and
                    change your preference.
                  </ListItem>
                  <ListItem>
                    <strong>Google Analytics Opt-out Browser Add-on:</strong> Google provides a
                    browser add-on that allows you to prevent your data from being used by Google
                    Analytics. You can download and install it from{' '}
                    <Link href="https://tools.google.com/dlpage/gaoptout" isExternal>
                      https://tools.google.com/dlpage/gaoptout
                    </Link>
                    .
                  </ListItem>
                </UnorderedList>
                <Text>
                  Please note that opting out of analytics tracking will not affect your ability to
                  use CodeGrind.
                </Text>
              </PolicySection>

              <Box height="50px" width="100%" mt={10}></Box>
            </VStack>
          </Container>
        </Box>

        {/* Right sidebar ad */}
        <Box
          width={{ base: '100%', lg: '250px' }}
          ml={{ base: 0, lg: 6 }}
          mt={{ base: 6, lg: 0 }}
          display={{ base: 'none', lg: 'block' }}
          position="relative"
        >
          <SidebarAd slotId={adSlots.generic.sidebar} />
        </Box>
      </Box>

      {/* Bottom banner ad */}
      <Box width="100%" maxWidth="728px" mx="auto" px={{ base: 4, md: 0 }} mt={6} mb={4} pb={12}>
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default PrivacyPolicyPage;
