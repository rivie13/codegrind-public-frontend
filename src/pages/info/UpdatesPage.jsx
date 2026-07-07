import {
  Badge,
  Box,
  Container,
  Divider,
  Heading,
  ListItem,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import PageTemplate from '../../components/layout/PageTemplate';
import PageSeo from '../../components/seo/PageSeo';
import BottomBannerAd from '../../components/ads/BottomBannerAd';
import TopBannerAd from '../../components/ads/TopBannerAd';
import adSlots from '../../config/adSlots';
import { updatesData } from '../../data/updates';
import { getPrerenderRouteDetails } from '../../prerenderRoutes';

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') {
    return null;
  }

  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (fullHex.length !== 6) {
    return null;
  }

  const int = parseInt(fullHex, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const toRgba = (hex, alpha) => {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const getReadableAccentColor = (hex, darkenAmount = 0.38) => {
  const rgb = hexToRgb(hex);

  if (!rgb) {
    return 'var(--cg-text)';
  }

  const adjustChannel = (channel) => Math.max(0, Math.round(channel * (1 - darkenAmount)));

  return `rgb(${adjustChannel(rgb.r)}, ${adjustChannel(rgb.g)}, ${adjustChannel(rgb.b)})`;
};

const headingOutline =
  '0.65px 0 rgba(0, 0, 0, 0.42), 0 0.65px rgba(0, 0, 0, 0.42), -0.65px 0 rgba(0, 0, 0, 0.42), 0 -0.65px rgba(0, 0, 0, 0.42)';

const UpdateList = ({ items, markerColor, spacing = 2, mb = 4, pl }) => (
  <UnorderedList
    spacing={spacing}
    mb={mb}
    pl={pl}
    fontFamily="var(--cg-font-retro-display)"
    color="var(--cg-text)"
    fontSize={{ base: 'sm', md: 'md' }}
    lineHeight={{ base: '1.6', md: '1.7' }}
    sx={{
      '& li::marker': {
        color: markerColor,
      },
    }}
  >
    {items.map((item, index) => {
      if (typeof item === 'string') {
        return <ListItem key={`${item}-${index}`}>{item}</ListItem>;
      }

      return (
        <ListItem key={`${item.title}-${index}`}>
          {item.title}
          <UpdateList
            items={item.items}
            markerColor={item.markerColor || markerColor}
            spacing={1}
            mb={2}
            pl={{ base: 4, md: 5 }}
          />
        </ListItem>
      );
    })}
  </UnorderedList>
);

const UpdateSection = ({ section, isLast }) => {
  const sectionHeadingColor = getReadableAccentColor(section.color, 0.46);
  const sectionMarkerColor = getReadableAccentColor(section.markerColor || section.color, 0.3);

  return (
    <>
      <Heading
        as="h3"
        size="md"
        mb={{ base: 2, md: 3 }}
        color={sectionHeadingColor}
        fontFamily="var(--cg-font-retro-display)"
        fontSize={{ base: 'lg', md: 'xl' }}
        textTransform="uppercase"
        letterSpacing="0.06em"
        textShadow={headingOutline}
      >
        {section.title}
      </Heading>
      <UpdateList
        items={section.items}
        markerColor={sectionMarkerColor}
        mb={isLast ? 0 : { base: 3, md: 4 }}
        pl={{ base: 4, md: 5 }}
      />
    </>
  );
};

const UpdateCard = ({ update }) => {
  const updateHeadingColor = getReadableAccentColor(update.accentColor, 0.34);

  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          release log
        </Text>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="rgba(255,255,255,0.14)">
        <Heading
          as="h2"
          size="lg"
          mb={{ base: 2, md: 3 }}
          color={updateHeadingColor}
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'xl', md: '2xl' }}
          lineHeight={{ base: '1.3', md: '1.4' }}
          textTransform="uppercase"
          letterSpacing="0.06em"
          textShadow={headingOutline}
        >
          {update.heading}
          {update.badge && (
            <Badge
              colorScheme={update.badge.colorScheme}
              ml={{ base: 0, md: 2 }}
              mt={{ base: 2, md: 0 }}
              display={{ base: 'inline-flex', md: 'inline' }}
              fontFamily="var(--cg-font-retro-display)"
              borderRadius="0"
            >
              {update.badge.text}
            </Badge>
          )}
        </Heading>
        <Text
          color="var(--cg-muted)"
          mb={{ base: 3, md: 4 }}
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'sm', md: 'md' }}
        >
          {update.release}
        </Text>
        <Divider mb={{ base: 3, md: 4 }} borderColor={toRgba(update.accentColor, 0.35)} />

        {update.sections.map((section, sectionIndex) => (
          <UpdateSection
            key={`${update.id}-${section.title}`}
            section={section}
            isLast={sectionIndex === update.sections.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
};

function UpdatesPage() {
  const route = getPrerenderRouteDetails('/updates');

  return (
    <PageTemplate title="Updates" showGiphyBackground>
      <PageSeo
        title={route.title}
        description={route.description}
        path={route.path}
        keywords={route.keywords}
      />
      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={{ base: 2, md: 4 }}
        mb={{ base: 4, md: 6 }}
        px={{ base: 4, md: 0 }}
      >
        <TopBannerAd slotId={adSlots.generic.top} />
      </Box>

      <Box width="100%" display="flex" flexDirection={{ base: 'column', lg: 'row' }}>
        <Box flex="1">
          <Container maxW="container.lg" py={{ base: 6, md: 8 }} px={{ base: 4, md: 6 }}>
            <Box
              className="cg-panel-window"
              overflow="hidden"
              mb={{ base: 4, md: 6 }}
              mt={{ base: 1, md: 2 }}
            >
              <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
                  updates.txt
                </Text>
              </Box>
              <Box p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
                <Heading
                  as="h1"
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize={{ base: '2xl', md: '3xl' }}
                  color="var(--cg-text)"
                  textAlign="center"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  Version History
                </Heading>
              </Box>
            </Box>

            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
              {updatesData.map((update) => (
                <Box key={update.id}>
                  <UpdateCard update={update} />
                  {update.dividerAfter && (
                    <Divider my={6} borderColor={toRgba(update.accentColor, 0.3)} />
                  )}
                </Box>
              ))}
            </VStack>
          </Container>
        </Box>
      </Box>

      <Box
        width="100%"
        maxWidth="728px"
        mx="auto"
        mt={{ base: 4, md: 6 }}
        mb={{ base: 4, md: 6 }}
        pb={{ base: 10, md: 12 }}
        px={{ base: 4, md: 0 }}
      >
        <BottomBannerAd slotId={adSlots.generic.bottom} />
      </Box>
    </PageTemplate>
  );
}

export default UpdatesPage;
