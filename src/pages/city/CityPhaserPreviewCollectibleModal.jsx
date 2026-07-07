import { Box, Button, Flex, Text } from '@chakra-ui/react';
import getAssetUrl from '../../utils/assets/assetUrl';

const UI_FONT = "'Tahoma', 'MS Sans Serif', sans-serif";
const FIELD_DISK_ICON_SRC = getAssetUrl(
  '/city-v2/tiled/device-shell-art/1-bit_Pixel_Icons/Sprites/Software_Internet_Download_Save_to_Disk.png'
);

const stopOverlayEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

export default function CityPhaserPreviewCollectibleModal({
  collectible,
  isAuthenticated,
  onClose,
  onCollect,
}) {
  if (!collectible) {
    return null;
  }

  return (
    <Box
      data-testid="city-preview-collectible-modal"
      position="absolute"
      inset={0}
      zIndex={15}
      bg="rgba(7, 11, 18, 0.72)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={4}
      pointerEvents="auto"
      onMouseDown={onClose}
    >
      <Box
        width="min(420px, calc(100vw - 32px))"
        maxH="calc(100vh - 32px)"
        overflowY="auto"
        border="2px solid #6f6f6f"
        bg="#d4d0c8"
        boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48), 0 14px 22px rgba(0,0,0,0.3)"
        onMouseDown={stopOverlayEvent}
      >
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg="linear-gradient(90deg, #000080 0%, #0a3ca6 100%)"
          borderBottom="1px solid #081a77"
        >
          <Box
            as="img"
            src={FIELD_DISK_ICON_SRC}
            alt=""
            aria-hidden="true"
            w="14px"
            h="14px"
            imageRendering="pixelated"
            filter="brightness(0) invert(1)"
          />
          <Text color="#f5f7ff" fontFamily={UI_FONT} fontSize="12px" fontWeight="700" noOfLines={1}>
            {collectible.title}
          </Text>
          <Text
            ml="auto"
            color="rgba(245, 247, 255, 0.84)"
            fontFamily={UI_FONT}
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
          >
            {collectible.statusLabel || 'Field disk'}
          </Text>
        </Flex>

        <Box px={4} py={4}>
          {collectible.eyebrow ? (
            <Text
              color="#000080"
              fontFamily={UI_FONT}
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              {collectible.eyebrow}
            </Text>
          ) : null}

          {collectible.imageSrc ? (
            <Box
              mt={3}
              border="2px solid #6f6f6f"
              bg="#11161f"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
              p={1}
            >
              <Box
                as="img"
                src={collectible.imageSrc}
                alt={collectible.imageAlt || collectible.title || 'Collectible portrait'}
                display="block"
                width="100%"
                maxH="220px"
                objectFit="cover"
              />
            </Box>
          ) : null}

          <Text
            mt={3}
            color="#171717"
            fontFamily={UI_FONT}
            fontSize="12px"
            fontWeight="700"
            lineHeight="1.55"
          >
            {collectible.description}
          </Text>

          {collectible.footer ? (
            <Text
              mt={3}
              color="rgba(23, 23, 23, 0.78)"
              fontFamily={UI_FONT}
              fontSize="11px"
              lineHeight="1.45"
            >
              {collectible.footer}
            </Text>
          ) : null}

          {!isAuthenticated ? (
            <Text
              mt={3}
              color="#7a1d1d"
              fontFamily={UI_FONT}
              fontSize="11px"
              fontWeight="700"
              lineHeight="1.45"
            >
              Sign in to add this field disk to your archive and receive Data Packets.
            </Text>
          ) : null}

          <Flex mt={4} gap={2} justify="flex-end" flexWrap="wrap">
            <Button
              borderRadius="0"
              minH="32px"
              px={4}
              bg="#d4d0c8"
              border="2px solid #6f6f6f"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
              color="#101010"
              fontFamily={UI_FONT}
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.04em"
              onClick={onClose}
              _hover={{ bg: '#dbd7cf' }}
              _active={{ bg: '#c8c3bb' }}
            >
              Close
            </Button>
            <Button
              borderRadius="0"
              minH="32px"
              px={4}
              bg={isAuthenticated ? '#efebe4' : '#c7c3bb'}
              border="2px solid #6f6f6f"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48)"
              color={isAuthenticated ? '#101010' : 'rgba(16, 16, 16, 0.62)'}
              fontFamily={UI_FONT}
              fontSize="11px"
              fontWeight="700"
              letterSpacing="0.04em"
              isDisabled={!isAuthenticated}
              onClick={() => onCollect?.(collectible.collectibleId)}
              _hover={isAuthenticated ? { bg: '#f6f2ea' } : undefined}
              _active={isAuthenticated ? { bg: '#ddd8cf' } : undefined}
            >
              Collect
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
