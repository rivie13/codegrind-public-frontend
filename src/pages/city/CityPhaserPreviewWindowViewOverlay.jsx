import { Box } from '@chakra-ui/react';
import CityPhaserPreviewNoticeCard from './CityPhaserPreviewNoticeCard';

export default function CityPhaserPreviewWindowViewOverlay({ onClose }) {
  return (
    <Box position="absolute" inset={0} zIndex={5} pointerEvents="none">
      <CityPhaserPreviewNoticeCard
        position="absolute"
        top={4}
        left="50%"
        transform="translateX(-50%)"
        width="min(92vw, 440px)"
        pointerEvents="auto"
        title="WINDOW VIEW"
        message="Port Meridian at dusk. Step back when you are ready to return."
      />

      <Box
        position="absolute"
        left="50%"
        bottom="calc(20px + env(safe-area-inset-bottom))"
        transform="translateX(-50%)"
        pointerEvents="auto"
      >
        <Box
          as="button"
          type="button"
          onClick={onClose}
          border="2px solid #6f6f6f"
          bg="#d4d0c8"
          color="#171717"
          boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.84), inset -1px -1px 0 rgba(104, 104, 104, 0.38)"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="11px"
          fontWeight="700"
          letterSpacing="0.06em"
          px={4}
          py={2}
          textTransform="uppercase"
          _hover={{ bg: '#e3dfd6' }}
          _active={{
            bg: '#c6c1b7',
            boxShadow:
              'inset -1px -1px 0 rgba(255, 255, 255, 0.84), inset 1px 1px 0 rgba(104, 104, 104, 0.45)',
          }}
        >
          Back to Room
        </Box>
      </Box>
    </Box>
  );
}
