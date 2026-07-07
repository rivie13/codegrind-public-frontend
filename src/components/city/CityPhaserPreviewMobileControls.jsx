import { Box, Grid, Text, VStack } from '@chakra-ui/react';

const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";

const DIRECTION_BUTTONS = [
  { id: 'up', label: 'Up', direction: 'arrowup', column: 2, row: 1 },
  { id: 'left', label: 'Lt', direction: 'arrowleft', column: 1, row: 2 },
  { id: 'right', label: 'Rt', direction: 'arrowright', column: 3, row: 2 },
  { id: 'down', label: 'Dn', direction: 'arrowdown', column: 2, row: 3 },
];

const RETRO_BUTTON_STYLES = {
  bg: '#d4d0c8',
  border: '2px solid #6f6f6f',
  boxShadow:
    'inset 1px 1px 0 rgba(255, 255, 255, 0.9), inset -1px -1px 0 rgba(104, 104, 104, 0.48), 0 10px 18px rgba(0, 0, 0, 0.24)',
  color: '#171717',
};

function RetroControlButton({
  children,
  isActive = false,
  isDisabled = false,
  onPointerDown,
  onPointerUp,
}) {
  return (
    <Box
      as="button"
      type="button"
      disabled={isDisabled}
      userSelect="none"
      style={{ WebkitUserSelect: 'none' }}
      minW="56px"
      h="56px"
      px={2}
      py={2}
      textAlign="center"
      transition="transform 80ms ease"
      _active={isDisabled ? undefined : { transform: 'translateY(1px)' }}
      onPointerDown={(event) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        if (isDisabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPointerUp?.(event);
      }}
      onPointerLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPointerUp?.(event);
      }}
      {...RETRO_BUTTON_STYLES}
      bg={isDisabled ? '#beb8ad' : isActive ? '#c6d9f5' : RETRO_BUTTON_STYLES.bg}
      color={isDisabled ? '#575757' : RETRO_BUTTON_STYLES.color}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      opacity={isDisabled ? 0.72 : 1}
    >
      <Text
        fontFamily={UI_FONT}
        fontSize="11px"
        fontWeight="700"
        letterSpacing="0.06em"
        textTransform="uppercase"
      >
        {children}
      </Text>
    </Box>
  );
}

function CityPhaserPreviewMobileControls({
  activeDirections,
  controlSide = 'right',
  isPhoneEnabled = true,
  interactionNotification,
  onDirectionEnd,
  onDirectionStart,
  onInteract,
  onOpenPhone,
  phoneButtonLabel = 'Phone',
  phoneNotification,
  showInteract = true,
}) {
  const isRightSideDPad = controlSide === 'right';

  return (
    <Box
      data-city-preview-mobile-controls="true"
      data-city-preview-control-side={controlSide}
      position="absolute"
      inset="0"
      zIndex={4}
      pointerEvents="none"
      userSelect="none"
      style={{ WebkitUserSelect: 'none' }}
    >
      <Grid
        data-city-preview-control-cluster="movement"
        pointerEvents="auto"
        position="absolute"
        bottom="calc(18px + env(safe-area-inset-bottom))"
        left={isRightSideDPad ? 'auto' : '14px'}
        right={isRightSideDPad ? '14px' : 'auto'}
        templateColumns="repeat(3, 56px)"
        templateRows="repeat(3, 56px)"
        gap={2}
      >
        {DIRECTION_BUTTONS.map((button) => (
          <Box key={button.id} gridColumn={button.column} gridRow={button.row}>
            <RetroControlButton
              isActive={Boolean(activeDirections?.[button.direction])}
              onPointerDown={() => onDirectionStart?.(button.direction)}
              onPointerUp={() => onDirectionEnd?.(button.direction)}
            >
              {button.label}
            </RetroControlButton>
          </Box>
        ))}
      </Grid>

      <VStack
        data-city-preview-control-cluster="actions"
        align="stretch"
        spacing={2}
        pointerEvents="auto"
        position="absolute"
        left={isRightSideDPad ? '14px' : 'auto'}
        right={isRightSideDPad ? 'auto' : '14px'}
        bottom="calc(18px + env(safe-area-inset-bottom))"
        maxW="148px"
      >
        {interactionNotification ? (
          <Box
            border="2px solid #6f6f6f"
            bg="#d4d0c8"
            boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48), 0 10px 18px rgba(0,0,0,0.24)"
            px={2.5}
            py={2}
          >
            <Box bg="#000080" color="#f5f7ff" px={2} py={1} mb={2}>
              <Text fontFamily={UI_FONT} fontSize="9px" fontWeight="700" letterSpacing="0.08em">
                INTERACT
              </Text>
            </Box>
            <Text
              color="#1b1b1b"
              fontFamily={UI_FONT}
              fontSize="10px"
              fontWeight="700"
              lineHeight="1.4"
            >
              {interactionNotification}
            </Text>
          </Box>
        ) : null}

        {phoneNotification ? (
          <Box
            border="2px solid #6f6f6f"
            bg="#d4d0c8"
            boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48), 0 10px 18px rgba(0,0,0,0.24)"
            px={2.5}
            py={2}
          >
            <Box bg="#000080" color="#f5f7ff" px={2} py={1} mb={2}>
              <Text fontFamily={UI_FONT} fontSize="9px" fontWeight="700" letterSpacing="0.08em">
                FIELD DEVICE
              </Text>
            </Box>
            <Text
              color="#1b1b1b"
              fontFamily={UI_FONT}
              fontSize="10px"
              fontWeight="700"
              lineHeight="1.4"
            >
              {phoneNotification}
            </Text>
          </Box>
        ) : null}

        <RetroControlButton
          isDisabled={!isPhoneEnabled}
          onPointerDown={onOpenPhone}
          onPointerUp={() => {}}
        >
          {phoneButtonLabel}
        </RetroControlButton>

        {showInteract ? (
          <RetroControlButton onPointerDown={onInteract} onPointerUp={() => {}}>
            Interact
          </RetroControlButton>
        ) : null}
      </VStack>
    </Box>
  );
}

export default CityPhaserPreviewMobileControls;
