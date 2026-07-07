import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const DataPacketsEarnedBadge = ({
  dataPackets,
  title = 'DATA PACKETS EARNED',
  theme = 'default',
}) => {
  if (!dataPackets || Number(dataPackets.totalEarned || 0) <= 0) return null;

  const isRetroDesktopTheme = theme === 'retro-desktop';

  return (
    <Box
      p={3}
      bg={isRetroDesktopTheme ? '#efebe7' : 'rgba(0, 255, 252, 0.06)'}
      borderRadius={isRetroDesktopTheme ? '0' : 'md'}
      border={isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 255, 252, 0.35)'}
      boxShadow={
        isRetroDesktopTheme
          ? 'inset 1px 1px 0 rgba(255,255,255,0.68), inset -1px -1px 0 rgba(64,64,64,0.24)'
          : 'none'
      }
    >
      <HStack justify="space-between" align="center" mb={1}>
        <Text
          color={isRetroDesktopTheme ? '#0a2c9a' : '#00fffc'}
          fontSize="xs"
          letterSpacing="0.12em"
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontWeight={isRetroDesktopTheme ? '700' : undefined}
        >
          {title}
        </Text>
        <HStack spacing={2}>
          <Text
            color={isRetroDesktopTheme ? '#0f6f17' : '#00ff8c'}
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
            fontWeight="bold"
            fontSize="sm"
          >
            +{dataPackets.totalEarned} Data Packets
          </Text>
        </HStack>
      </HStack>

      {dataPackets.walletBalance !== null ? (
        <VStack align="start" spacing={0}>
          <Text
            color={isRetroDesktopTheme ? '#3b4250' : 'gray.300'}
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
            fontSize="xs"
          >
            Wallet Balance: {dataPackets.walletBalance}
          </Text>
        </VStack>
      ) : null}
    </Box>
  );
};

export default DataPacketsEarnedBadge;
