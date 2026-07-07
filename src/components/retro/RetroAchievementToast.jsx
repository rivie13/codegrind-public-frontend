import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const bodyTextProps = {
  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
  color: '#1f2430',
};

export default function RetroAchievementToast({ heading, title, description, icon, onClose }) {
  return (
    <Box
      maxW={{ base: 'calc(100vw - 1rem)', sm: '28rem' }}
      w="full"
      bg="#d4d0c8"
      border="2px solid #5d636e"
      boxShadow="var(--cg-window-outset), 10px 10px 0 rgba(31, 36, 48, 0.18)"
      color="#1f2430"
      wordBreak="break-word"
      cursor="pointer"
      onClick={onClose}
    >
      <Box
        className="cg-titlebar"
        px={3}
        py={1.5}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={3}
      >
        <Text
          fontSize="11px"
          fontWeight="700"
          letterSpacing="0.06em"
          textTransform="uppercase"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
        >
          {heading}
        </Text>
        <Box
          w="14px"
          h="14px"
          bg="#d4d0c8"
          border="1px solid rgba(31, 36, 48, 0.45)"
          boxShadow="var(--cg-window-outset)"
          flexShrink={0}
        />
      </Box>

      <HStack spacing={3} align="flex-start" px={3} py={3}>
        {icon ? (
          <Box
            minW="42px"
            h="42px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="#efebe7"
            border="1px solid #7f7f7f"
            boxShadow="var(--cg-window-inset)"
            fontSize="24px"
            lineHeight="1"
          >
            {icon}
          </Box>
        ) : null}

        <VStack align="start" spacing={1} minW={0} flex="1">
          <Text
            {...bodyTextProps}
            fontSize={{ base: 'sm', sm: 'md' }}
            fontWeight="700"
            color="#0a2c9a"
          >
            {title}
          </Text>
          <Text {...bodyTextProps} fontSize={{ base: 'xs', sm: 'sm' }} lineHeight="1.5">
            {description}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
