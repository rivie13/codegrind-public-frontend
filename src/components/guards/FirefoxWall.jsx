import { Box, Button, Flex, Heading, Icon, List, ListIcon, ListItem, Text } from '@chakra-ui/react';
import React from 'react';

// Classic Win95 Font Stack
const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

// Custom Retro Browser Icon
const BrowserIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm0 14H5V8h14v10zm-7-1c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm0-3c.55 0 1-.45 1-1V11c0-.55-.45-1-1-1s-1 .45-1 1v2c0 .55.45 1 1 1z"
    />
  </Icon>
);

// Classic Win95 Red Error Circle Icon
const Win95CriticalIcon = (props) => (
  <Icon viewBox="0 0 32 32" {...props}>
    <circle cx="16" cy="16" r="14" fill="#ff0000" stroke="#000000" strokeWidth="2" />
    <circle cx="16" cy="16" r="12" fill="none" stroke="#800000" strokeWidth="1" />
    <path
      d="M10 10 L22 22 M22 10 L10 22"
      stroke="#ffffff"
      strokeWidth="3.5"
      strokeLinecap="square"
    />
  </Icon>
);

// Standard bullet / arrow icon for lists
const RetroArrowIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M10 17l5-5-5-5v10z" />
  </Icon>
);

const FirefoxWall = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }

  // Detect Firefox
  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox/i.test(ua);

  // Check for the bypass query param
  const urlParams = new URLSearchParams(window.location.search);
  const isBypassed = urlParams.get('bypass_firefox_gate') === 'true';

  // Do not block if not Firefox or bypassed
  if (!isFirefox || isBypassed) {
    return null;
  }

  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex="10000"
      bg="#008080" // Windows 95 Teal Desktop color
      align="center"
      justify="center"
      px={4}
      py={4}
      fontFamily={UI_FONT_FAMILY}
      style={{
        backgroundImage:
          'radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 80%)',
      }}
    >
      <Box
        className="cg-panel-window"
        maxW="560px"
        w="full"
        maxH="95dvh"
        overflowY="auto"
        bg="#d4d0c8" // Win95 face color
        borderRadius="0"
      >
        {/* Title Bar */}
        <Flex
          className="cg-titlebar"
          px={3}
          py={1.5}
          justify="space-between"
          align="center"
          userSelect="none"
        >
          <Flex align="center" gap={2}>
            <BrowserIcon boxSize={4} color="#f5f7ff" />
            <Text
              color="#ffffff"
              fontSize="xs"
              fontWeight="bold"
              letterSpacing="0.04em"
              textTransform="uppercase"
            >
              SYSTEM_ERROR_WARNING.EXE
            </Text>
          </Flex>
        </Flex>

        {/* Content Area */}
        <Box p={{ base: 4, md: 6 }} color="#1e1e1e">
          <Flex gap={{ base: 3, md: 4 }} align="start" mb={4}>
            <Win95CriticalIcon boxSize={{ base: 8, md: 10 }} flexShrink={0} />
            <Box>
              <Heading
                as="h1"
                size="md"
                mb={2}
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="bold"
                color="#000000"
                lineHeight="short"
              >
                BOM: BROWSER_NOT_SUPPORTED
              </Heading>
              <Text fontSize={{ base: 'xs', md: 'sm' }} lineHeight="tall" color="#1e1e1e" mb={3}>
                CodeGrind has detected that you are running the Firefox browser. Firefox is not
                supported on this platform, and we do not allow access with ad blockers enabled.
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} lineHeight="tall" color="#1e1e1e" mb={3}>
                CodeGrind is a freemium service that depends on ads to keep our service alive. If
                you would like to have an ad free experience, consider subscribing for less than the
                cost of a fancy coffee.
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} lineHeight="tall" color="#1e1e1e">
                To access the learning paths, coding problems, and tower defense games, you must
                switch to a supported browser.
              </Text>
            </Box>
          </Flex>

          {/* List Box */}
          <Box
            bg="#ffffff"
            color="#000000"
            border="2px solid"
            borderColor="gray.600"
            boxShadow="var(--cg-window-inset)"
            p={{ base: 3, md: 4 }}
            mb={{ base: 4, md: 5 }}
          >
            <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }} mb={2} color="#000080">
              Required Browsers:
            </Text>
            <List
              spacing={{ base: 1.5, md: 2 }}
              fontSize={{ base: 'xs', md: 'sm' }}
              fontFamily="var(--cg-font-retro-terminal)"
            >
              <ListItem>
                <ListIcon as={RetroArrowIcon} color="#000080" />
                Google Chrome (Recommended)
              </ListItem>
              <ListItem>
                <ListIcon as={RetroArrowIcon} color="#000080" />
                Microsoft Edge
              </ListItem>
              <ListItem>
                <ListIcon as={RetroArrowIcon} color="#000080" />
                Apple Safari
              </ListItem>
            </List>
          </Box>

          {/* Dialog Action Buttons */}
          <Flex justify="flex-end" gap={{ base: 2, md: 3 }}>
            <Button
              size={{ base: 'sm', md: 'md' }}
              px={6}
              isDisabled={true}
              borderColor="var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
            >
              OK
            </Button>
            <Button
              size={{ base: 'sm', md: 'md' }}
              px={6}
              isDisabled={true}
              borderColor="var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
            >
              Cancel
            </Button>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
};

export default FirefoxWall;
