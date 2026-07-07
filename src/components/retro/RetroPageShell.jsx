import { Box, Container, Divider, Flex, Stack, Text, VStack } from '@chakra-ui/react';

export const RETRO_PANEL_BODY_BG = 'rgba(255,255,255,0.14)';
export const RETRO_PANEL_INSET_BG = 'rgba(255,255,255,0.18)';
export const RETRO_PANEL_BORDER = '1px solid var(--cg-window-dark)';
export const RETRO_PANEL_INSET_SHADOW = 'var(--cg-window-inset)';

export function RetroInset({ children, ...props }) {
  return (
    <Box
      bg={RETRO_PANEL_INSET_BG}
      border={RETRO_PANEL_BORDER}
      boxShadow={RETRO_PANEL_INSET_SHADOW}
      {...props}
    >
      {children}
    </Box>
  );
}

export function RetroPanel({
  bodyProps,
  children,
  fileLabel = 'window.ini',
  title,
  subtitle,
  titlebarActions,
  ...props
}) {
  return (
    <Box className="cg-panel-window" overflow="hidden" {...props}>
      <Flex
        className="cg-titlebar"
        px={{ base: 3, md: 4 }}
        py={2}
        align="center"
        justify="space-between"
        gap={3}
      >
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
          {fileLabel}
        </Text>
        {titlebarActions ? (
          <Box display="flex" alignItems="center" fontSize="var(--cg-font-size-meta)" opacity={0.9}>
            {titlebarActions}
          </Box>
        ) : null}
      </Flex>

      <Box p={{ base: 4, md: 5 }} bg={RETRO_PANEL_BODY_BG} {...bodyProps}>
        {title || subtitle ? (
          <Stack spacing={1.5} mb={children ? 4 : 0}>
            {title ? (
              <Text
                color="var(--cg-text)"
                fontSize={{ base: 'lg', md: 'xl' }}
                fontWeight="700"
                fontFamily="var(--cg-font-retro-display)"
                textTransform="uppercase"
                letterSpacing="0.08em"
              >
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text
                color="var(--cg-muted)"
                fontSize={{ base: 'sm', md: 'md' }}
                fontFamily="var(--cg-font-retro-display)"
                lineHeight="1.7"
              >
                {subtitle}
              </Text>
            ) : null}
            {children ? <Divider borderColor="var(--cg-window-dark)" /> : null}
          </Stack>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}

function RetroPageShell({
  topSlot,
  bottomSlot,
  leftSidebar,
  rightSidebar,
  heroActions,
  heroFileLabel = 'surface.exe',
  heroMeta,
  heroTitle,
  heroSubtitle,
  heroPanelProps,
  mainMaxW = 'container.xl',
  children,
}) {
  return (
    <>
      {topSlot}

      <Box width="100%" display="flex" flexDirection={{ base: 'column', lg: 'row' }}>
        {leftSidebar ? (
          <Box
            width={{ base: '100%', lg: '250px' }}
            mr={{ base: 0, lg: 6 }}
            mb={{ base: 6, lg: 0 }}
            display={{ base: 'none', lg: 'block' }}
            position="relative"
          >
            {leftSidebar}
          </Box>
        ) : null}

        <Box flex="1" width="100%">
          <Container maxW={mainMaxW} width="100%" px={{ base: 4, md: 6 }} pb={{ base: 12, md: 20 }}>
            <VStack spacing={{ base: 6, md: 8 }} align="stretch">
              <RetroPanel
                fileLabel={heroFileLabel}
                title={heroTitle}
                subtitle={heroSubtitle}
                titlebarActions={
                  heroMeta ? (
                    <Text
                      fontSize="var(--cg-font-size-meta)"
                      fontWeight="700"
                      textTransform="uppercase"
                    >
                      {heroMeta}
                    </Text>
                  ) : null
                }
                {...heroPanelProps}
              >
                {heroActions ? (
                  <Flex wrap="wrap" gap={3} align="center">
                    {heroActions}
                  </Flex>
                ) : null}
              </RetroPanel>

              {children}
            </VStack>
          </Container>
        </Box>

        {rightSidebar ? (
          <Box
            width={{ base: '100%', lg: '250px' }}
            ml={{ base: 0, lg: 6 }}
            mt={{ base: 6, lg: 0 }}
            display={{ base: 'none', lg: 'block' }}
            position="relative"
          >
            {rightSidebar}
          </Box>
        ) : null}
      </Box>

      {bottomSlot}
    </>
  );
}

export default RetroPageShell;
