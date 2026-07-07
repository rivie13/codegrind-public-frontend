import { Box, Text } from '@chakra-ui/react';

export default function CityPhaserPreviewNoticeCard({
  children,
  message,
  title,
  ...containerProps
}) {
  return (
    <Box
      border="2px solid #6f6f6f"
      bg="#d4d0c8"
      boxShadow="inset 1px 1px 0 rgba(255,255,255,0.9), inset -1px -1px 0 rgba(104,104,104,0.48), 0 10px 18px rgba(0,0,0,0.24)"
      px={3}
      py={3}
      {...containerProps}
    >
      <Box bg="#000080" color="#f5f7ff" px={2} py={1} mb={2}>
        <Text
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="10px"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          {title}
        </Text>
      </Box>
      {message ? (
        <Text
          color="#171717"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontSize="11px"
          fontWeight="700"
          lineHeight="1.45"
        >
          {message}
        </Text>
      ) : null}
      {children}
    </Box>
  );
}
