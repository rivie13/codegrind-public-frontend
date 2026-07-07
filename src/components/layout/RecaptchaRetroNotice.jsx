import { Box, Button, HStack, Link, Text, VStack } from '@chakra-ui/react';
import { HiOutlineShieldCheck } from 'react-icons/hi2';

const RECAPTCHA_PRIVACY_URL = 'https://policies.google.com/privacy';
const RECAPTCHA_TERMS_URL = 'https://policies.google.com/terms';

function RecaptchaRetroNotice({ enabled = false, isHidden = false, onDismiss }) {
  if (!enabled || isHidden) {
    return null;
  }

  return (
    <Box
      className="cg-recaptcha-retro-shell"
      position="fixed"
      right="12px"
      bottom={{ base: '96px', lg: '84px' }}
      width={{ base: 'min(232px, calc(100vw - 24px))', md: '252px' }}
      maxW="calc(100vw - 24px)"
      bg="var(--cg-window-face)"
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset), 4px 4px 0 rgba(0, 0, 0, 0.2)"
      color="var(--cg-text)"
      zIndex="1698"
      overflow="hidden"
    >
      <HStack
        spacing={2}
        align="center"
        px={2.5}
        py={1.5}
        bg="linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)"
        borderBottom="1px solid var(--cg-window-shadow)"
      >
        <Box
          width="14px"
          height="14px"
          bg="var(--cg-window-face)"
          border="1px solid rgba(255, 255, 255, 0.8)"
          boxShadow="inset -1px -1px 0 rgba(0, 0, 0, 0.18)"
          display="grid"
          placeItems="center"
          color="#0a2c9a"
          flexShrink={0}
        >
          <HiOutlineShieldCheck size={10} />
        </Box>
        <Text
          fontFamily="var(--cg-font-retro-display)"
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
          color="#f7f9ff"
          noOfLines={1}
          flex="1"
        >
          security.cpl
        </Text>
        {typeof onDismiss === 'function' ? (
          <Button
            size="xs"
            minW="18px"
            h="18px"
            px={0}
            borderRadius="0"
            bg="var(--cg-window-face)"
            color="#0a2c9a"
            border="1px solid rgba(255, 255, 255, 0.86)"
            boxShadow="inset -1px -1px 0 rgba(0, 0, 0, 0.2)"
            _hover={{ bg: '#f4f0e7' }}
            _active={{ transform: 'translateY(1px)' }}
            onClick={onDismiss}
            aria-label="Hide security notice"
          >
            x
          </Button>
        ) : null}
      </HStack>

      <VStack align="stretch" spacing={2} px={3} py={2.5}>
        <HStack align="start" spacing={2.5}>
          <Box
            width="28px"
            height="28px"
            bg="linear-gradient(180deg, #f7f3e8 0%, #d4d0c8 100%)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.9), inset -1px -1px 0 rgba(0, 0, 0, 0.18)"
            display="grid"
            placeItems="center"
            color="var(--cg-accent-green)"
            flexShrink={0}
          >
            <HiOutlineShieldCheck size={16} />
          </Box>

          <VStack align="stretch" spacing={0.5} flex="1" minW="0">
            <Text
              fontFamily="var(--cg-font-retro-display)"
              fontSize="12px"
              fontWeight="700"
              textTransform="uppercase"
              letterSpacing="0.08em"
              lineHeight="1.2"
            >
              This website is protected by:
            </Text>
            <Text
              fontFamily="var(--cg-font-retro-display)"
              fontSize="10px"
              fontWeight="700"
              lineHeight="1.3"
            >
              reCAPTCHA Enterprise
            </Text>
            <Text fontSize="10px" lineHeight="1.45" color="var(--cg-muted)">
              Google Privacy Policy and Terms of Service apply.
            </Text>
          </VStack>
        </HStack>

        <HStack spacing={2} justify="flex-end" fontSize="10px">
          <Link href={RECAPTCHA_PRIVACY_URL} isExternal color="var(--cg-link)" fontWeight="700">
            Privacy
          </Link>
          <Text color="var(--cg-muted)">|</Text>
          <Link href={RECAPTCHA_TERMS_URL} isExternal color="var(--cg-link)" fontWeight="700">
            Terms
          </Link>
        </HStack>
      </VStack>
    </Box>
  );
}

export default RecaptchaRetroNotice;
