import { Box, Button, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { getSupportEmail } from '../../constants/supportEmail';
import BugReportButton from './BugReportButton';

function SupportContactPanel({
  title = 'Need help getting in touch?',
  description = 'Use the right contact path so messages land in the right inbox quickly.',
  showBilling = false,
  showInfo = true,
  showBugReport = false,
  bugReportProps = {},
}) {
  return (
    <Box w="100%" maxW="4xl" className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          support.txt
        </Text>
      </Box>

      <Stack spacing={4} p={{ base: 4, md: 5 }} bg="rgba(255,255,255,0.14)">
        <Stack spacing={1}>
          <Text
            color="var(--cg-text)"
            fontWeight="700"
            fontSize={{ base: 'lg', md: 'xl' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            {title}
          </Text>
          <Text color="var(--cg-muted)" fontSize="sm" fontFamily="var(--cg-font-retro-display)">
            {description}
          </Text>
        </Stack>

        <HStack spacing={3} flexWrap="wrap" align="center">
          {showInfo ? (
            <Box display="flex" alignItems="center">
              <Button
                as={Link}
                href={`mailto:${getSupportEmail('info')}`}
                color="var(--cg-link)"
                minH="44px"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                fontFamily="var(--cg-font-retro-display)"
              >
                Contact Support: {getSupportEmail('info')}
              </Button>
            </Box>
          ) : null}

          {showBilling ? (
            <Box display="flex" alignItems="center">
              <Button
                as={Link}
                href={`mailto:${getSupportEmail('billing')}`}
                color="var(--cg-accent-green)"
                minH="44px"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                fontFamily="var(--cg-font-retro-display)"
              >
                Billing Help: {getSupportEmail('billing')}
              </Button>
            </Box>
          ) : null}

          {showBugReport ? (
            <Box display="flex" alignItems="center">
              <BugReportButton
                buttonLabel="Report a Bug"
                buttonProps={{
                  colorScheme: 'red',
                  variant: 'outline',
                  minH: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                {...bugReportProps}
              />
            </Box>
          ) : null}
        </HStack>

        <Stack spacing={1}>
          {showBilling ? (
            <Text color="var(--cg-muted)" fontSize="sm" fontFamily="var(--cg-font-retro-display)">
              Subscription, invoices, and billing changes: {getSupportEmail('billing')}
            </Text>
          ) : null}
          {showInfo ? (
            <Text color="var(--cg-muted)" fontSize="sm" fontFamily="var(--cg-font-retro-display)">
              General questions, account help, and support requests: {getSupportEmail('info')}
            </Text>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

export default SupportContactPanel;
