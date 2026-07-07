import { Box, Center, Heading, Text, VStack } from '@chakra-ui/react';
import PageTemplate from '../layout/PageTemplate';

const STATUS_TONES = {
  info: {
    accent: 'var(--cg-accent-blue)',
    label: 'Status',
  },
  success: {
    accent: 'var(--cg-accent-green)',
    label: 'Success',
  },
  warning: {
    accent: 'var(--cg-accent-amber)',
    label: 'Attention',
  },
  error: {
    accent: 'var(--cg-accent-red)',
    label: 'Error',
  },
};

function AuthRetroStatusLayout({
  children,
  description,
  fileLabel = 'auth.exe',
  footer = null,
  icon = null,
  meta = null,
  status = 'info',
  statusLabel = null,
  title,
}) {
  const tone = STATUS_TONES[status] || STATUS_TONES.info;

  return (
    <PageTemplate showCityReturnBanner={false}>
      <Center
        minH="100vh"
        px={{ base: 4, md: 6 }}
        py={{ base: 10, md: 14 }}
        bg={[
          'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0 2px, transparent 2px 100%)',
          'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0 10%, transparent 10% 100%)',
          'linear-gradient(180deg, #1b7b86 0%, #0b4e61 100%)',
        ].join(', ')}
      >
        <Box
          className="cg-panel-window"
          width="100%"
          maxW="640px"
          overflow="hidden"
          position="relative"
        >
          <Box
            className="cg-titlebar"
            px={{ base: 3, md: 4 }}
            py={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={3}
          >
            <Text fontSize="11px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
              {fileLabel}
            </Text>
            <Text fontSize="10px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
              {statusLabel || tone.label}
            </Text>
          </Box>

          <Box p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.16)">
            <VStack align="stretch" spacing={4}>
              <Box
                bg="var(--cg-window-face)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                px={{ base: 4, md: 5 }}
                py={{ base: 4, md: 5 }}
              >
                <VStack align="stretch" spacing={3}>
                  {icon ? (
                    <Box
                      width="52px"
                      height="52px"
                      display="grid"
                      placeItems="center"
                      bg="var(--cg-window)"
                      border="1px solid var(--cg-window-shadow)"
                      boxShadow="var(--cg-window-inset)"
                      color={tone.accent}
                      fontSize="28px"
                    >
                      {icon}
                    </Box>
                  ) : null}

                  <Box>
                    <Heading
                      size="md"
                      color={tone.accent}
                      fontFamily="var(--cg-font-retro-display)"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      {title}
                    </Heading>
                    {description ? (
                      <Text mt={3} color="var(--cg-text)" lineHeight="1.7">
                        {description}
                      </Text>
                    ) : null}
                  </Box>

                  {meta ? (
                    <Box
                      bg="var(--cg-window)"
                      border="1px solid var(--cg-window-shadow)"
                      boxShadow="var(--cg-window-inset)"
                      px={3}
                      py={2.5}
                    >
                      <Text color="var(--cg-muted)" fontSize="sm" lineHeight="1.6">
                        {meta}
                      </Text>
                    </Box>
                  ) : null}

                  {children}

                  {footer ? (
                    <Text color="var(--cg-muted)" fontSize="sm" lineHeight="1.6">
                      {footer}
                    </Text>
                  ) : null}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Center>
    </PageTemplate>
  );
}

export default AuthRetroStatusLayout;
