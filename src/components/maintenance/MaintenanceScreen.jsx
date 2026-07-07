import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

export default function MaintenanceScreen({ onClose = null }) {
  return (
    <Modal isOpen onClose={onClose || (() => {})} isCentered size="2xl" closeOnEsc={false} closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(40, 52, 68, 0.28)" />
      <ModalContent
        bg="#d4d0c8"
        borderRadius="0"
        color="#1f2430"
        overflow="hidden"
        boxShadow="0 0 0 1px #7f7f7f"
      >
        <ModalHeader
          bg="linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)"
          color="#f5f7ff"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          fontWeight="700"
          letterSpacing="0.08em"
          py={2}
          px={4}
          textTransform="uppercase"
        >
          System Maintenance
        </ModalHeader>
        <ModalCloseButton
          color="#f5f7ff"
          top={0}
          right={3}
          borderRadius="0"
          _hover={{ bg: 'rgba(255,255,255,0.12)' }}
          _active={{ bg: 'rgba(0,0,0,0.12)' }}
        />

        <ModalBody bg="#d4d0c8" px={5} py={4}>
          <VStack align="start" spacing={3}>
            <Text
              fontSize="sm"
              fontFamily="var(--cg-font-retro-terminal)"
              color="#1f2430"
              lineHeight="1.6"
              whiteSpace="pre-line"
            >
              {`CodeGrind is temporarily offline for maintenance and infrastructure upgrades. We're migrating to new cloud providers and working on making parts of the codebase open source.
              
              During this time, some features may be unavailable or limited. There will be bugs and issues as we transition to the new system, but we're working hard to minimize downtime and restore full functionality as quickly as possible.
              
              We apologize for the inconvenience and appreciate your patience during this transition.`}
            </Text>

            <Box
              bg="#d4d0c8"
              border="1px solid #7f7f7f"
              borderRadius="0"
              boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080"
              p={3}
              w="100%"
            >
              <Text
                fontSize="xs"
                fontFamily="var(--cg-font-retro-terminal)"
                color="#1f2430"
                lineHeight="1.5"
              >
                Status: Migration in progress • Frontend shell: online • Backend & API: online (still testing) • Database: online (still testing) • Code Execution: online (still testing) • AI features: online (still testing)
              </Text>
            </Box>

            <Text
              fontSize="sm"
              fontFamily="var(--cg-font-retro-terminal)"
              color="#1f2430"
              lineHeight="1.6"
            >
              Thank you for your patience. We'll be back online soon with better performance and
              new features.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter bg="#d4d0c8" px={5} py={3}>
          <Button
            as="a"
            href="https://stats.uptimerobot.com/MYXleQpuCX"
            target="_blank"
            rel="noopener noreferrer"
            bg="white"
            color="#1f2430"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.04em"
            px={4}
            py={1}
            mr={2}
            h="auto"
            borderRadius="0"
            border="1px solid #7f7f7f"
            boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080"
            _hover={{
              bg: '#dfdfdf',
              textDecoration: 'none',
            }}
            _active={{
              boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff',
              transform: 'translate(1px, 1px)',
            }}
          >
            CodeGrind Status Page (External)
          </Button>
          <Button
            onClick={onClose || (() => {})}
            bg="white"
            color="#1f2430"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.04em"
            px={4}
            py={1}
            h="auto"
            borderRadius="0"
            border="1px solid #7f7f7f"
            boxShadow="inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080"
            _hover={{
              bg: '#dfdfdf',
            }}
            _active={{
              boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff',
              transform: 'translate(1px, 1px)',
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
