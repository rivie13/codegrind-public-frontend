import { Box, Text } from '@chakra-ui/react';

export default function CityPhaserPreviewInputTracePanel({
  previewInputTrace,
  previewInteractionState,
}) {
  return (
    <Box
      data-testid="preview-input-trace"
      position="absolute"
      right={3}
      bottom={3}
      zIndex={13}
      width="min(360px, calc(100vw - 24px))"
      border="2px solid #6f6f6f"
      bg="#d4d0c8"
      boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48), 0 10px 18px rgba(0,0,0,0.24)"
      px={3}
      py={3}
      pointerEvents="none"
    >
      <Box bg="#000080" color="#f5f7ff" px={2} py={1} mb={2}>
        <Text
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="10px"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          KEY INPUT TRACE
        </Text>
      </Box>
      <Text
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        fontWeight="700"
        lineHeight="1.45"
        mb={2}
      >
        {previewInputTrace.note}
      </Text>
      <Text
        data-testid="preview-input-trace-event"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Event: {previewInputTrace.eventType}
      </Text>
      <Text
        data-testid="preview-input-trace-key"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Key: {previewInputTrace.key || 'none'}
      </Text>
      <Text
        data-testid="preview-input-trace-code"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Code: {previewInputTrace.code || 'none'}
      </Text>
      <Text
        data-testid="preview-input-trace-modifiers"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Shift: {previewInputTrace.shiftKey ? 'ON' : 'OFF'} | Caps Lock:{' '}
        {previewInputTrace.capsLock ? 'ON' : 'OFF'} | Repeat:{' '}
        {previewInputTrace.repeat ? 'ON' : 'OFF'}
      </Text>
      <Text
        data-testid="preview-input-trace-default"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        defaultPrevented on arrival:{' '}
        {previewInputTrace.defaultPreventedBeforeHandler ? 'YES' : 'no'}
      </Text>
      <Text
        data-testid="preview-input-trace-target"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Target: {previewInputTrace.targetTag} | Active: {previewInputTrace.activeElementTag}
      </Text>
      <Text
        data-testid="preview-input-trace-focus"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Document Focus: {previewInputTrace.documentHasFocus ? 'ON' : 'OFF'}
      </Text>
      <Text
        data-testid="preview-input-trace-scene-direction"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Scene Direction: {previewInputTrace.sceneDirection || 'none'}
      </Text>
      <Text
        data-testid="preview-input-trace-scene-received"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Scene Received: {previewInputTrace.sceneReceived ? 'ON' : 'OFF'}
      </Text>
      <Text
        data-testid="preview-input-trace-scene-right"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Scene Right Active: {previewInteractionState?.inputDebug?.sceneRightActive ? 'ON' : 'OFF'}
      </Text>
      <Text
        data-testid="preview-input-trace-scene-sources"
        color="#171717"
        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        fontSize="11px"
        lineHeight="1.35"
      >
        Scene Sources: Arrow{' '}
        {previewInteractionState?.inputDebug?.sceneArrowRightActive ? 'ON' : 'OFF'} / WASD{' '}
        {previewInteractionState?.inputDebug?.sceneWasdRightActive ? 'ON' : 'OFF'} / Touch{' '}
        {previewInteractionState?.inputDebug?.sceneTouchRightActive ? 'ON' : 'OFF'}
      </Text>
    </Box>
  );
}
