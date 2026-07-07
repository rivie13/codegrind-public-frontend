import { Box, Flex, Select, Text, Tooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import logger from '../../utils/core/logger';

const MotionBox = motion(Box);

/**
 * Reusable AI model selector. Fetches available models for the user's tier
 * and the given feature, renders a Chakra Select with retro desktop chrome by default.
 *
 * @param {Object} props
 * @param {'chat'|'snippet'|'problem'|'refinement'|'analysis'} props.feature
 * @param {string} props.value     - Currently selected model ID
 * @param {(id: string) => void} props.onChange - Called with the new model ID
 * @param {string} [props.size]    - Chakra size prop ('sm','md','lg')
 * @param {boolean} [props.showCost] - Show credit cost badge next to name
 * @param {boolean} [props.compact]  - Minimal layout (no label, tighter spacing)
 * @param {boolean} [props.isDisabled] - Disable selection input
 */
const ModelSelector = ({
  feature = 'chat',
  value,
  onChange,
  size = 'sm',
  showCost = true,
  compact = false,
  isDisabled = false,
  theme = 'retro-desktop',
}) => {
  const isRetroDesktopTheme = theme === 'retro-desktop';
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.models.getAvailable(feature);
        if (!cancelled) {
          setModels(data.models || []);
          // If no value is set yet, pick the default
          if (!value && data.models?.length) {
            const defaultModel = data.models.find((m) => m.isDefault) || data.models[0];
            onChange?.(defaultModel.id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('[ModelSelector] Failed to fetch models:', err);
          setError('Failed to load models');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchModels();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  if (error) {
    return (
      <Text
        fontSize="xs"
        color={isRetroDesktopTheme ? '#7d1d1d' : '#FF005C'}
        fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
      >
        {error}
      </Text>
    );
  }

  if (loading) {
    return (
      <MotionBox
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Select
          size={size}
          isDisabled
          placeholder="Loading models..."
          bg={isRetroDesktopTheme ? '#ece8df' : '#121417'}
          color={isRetroDesktopTheme ? '#5a5a5a' : 'gray.500'}
          borderColor={isRetroDesktopTheme ? '#6f6f6f' : 'rgba(0, 255, 255, 0.2)'}
          borderWidth={isRetroDesktopTheme ? '2px' : '1px'}
          borderRadius={isRetroDesktopTheme ? '0' : undefined}
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontSize="xs"
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.24)'
              : undefined
          }
        />
      </MotionBox>
    );
  }

  if (!models.length) {
    return (
      <Text
        fontSize="xs"
        color={isRetroDesktopTheme ? '#5a5a5a' : 'gray.500'}
        fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
      >
        No models available
      </Text>
    );
  }

  return (
    <Flex direction="column" gap={compact ? 0 : 1}>
      {!compact && (
        <Flex align="center" gap={2}>
          <Text
            fontSize="xs"
            color={isRetroDesktopTheme ? '#1f2128' : '#00FFFF'}
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px rgba(0, 255, 255, 0.3)'}
          >
            AI_MODEL
          </Text>
          {showCost && value && (
            <CreditBadge cost={models.find((m) => m.id === value)?.creditCost} theme={theme} />
          )}
        </Flex>
      )}
      <Tooltip
        label={models.find((m) => m.id === value)?.description || ''}
        placement="top"
        hasArrow
        bg={isRetroDesktopTheme ? '#ece8df' : '#0a0a0a'}
        color={isRetroDesktopTheme ? '#1f2128' : '#00FFFF'}
        border={isRetroDesktopTheme ? '1px solid #6f6f6f' : '1px solid rgba(0, 255, 255, 0.3)'}
        fontSize="xs"
        fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
      >
        <Select
          size={size}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          isDisabled={isDisabled || models.length <= 1}
          bg={isRetroDesktopTheme ? '#f7f4ee' : '#121417'}
          color={isRetroDesktopTheme ? '#1f2128' : 'white'}
          borderColor={isRetroDesktopTheme ? '#6f6f6f' : 'rgba(0, 255, 255, 0.3)'}
          borderWidth={isRetroDesktopTheme ? '2px' : '1px'}
          borderRadius={isRetroDesktopTheme ? '0' : undefined}
          fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
          fontSize="xs"
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.24)'
              : undefined
          }
          _hover={
            isRetroDesktopTheme
              ? {
                  borderColor: '#4d4d4d',
                }
              : { borderColor: '#00FFFF', boxShadow: '0 0 5px rgba(0, 255, 255, 0.3)' }
          }
          _focus={
            isRetroDesktopTheme
              ? {
                  borderColor: '#0a3ca6',
                  boxShadow:
                    'inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(104,104,104,0.24)',
                }
              : {
                  borderColor: '#00FFFF',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.5)',
                }
          }
          sx={{
            option: {
              bg: isRetroDesktopTheme ? '#f7f4ee' : '#0a0a0a',
              color: isRetroDesktopTheme ? '#1f2128' : 'white',
            },
          }}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
              {showCost && m.creditCost > 1 ? ` (${m.creditCost}x credits)` : ''}
            </option>
          ))}
        </Select>
      </Tooltip>
    </Flex>
  );
};

// ── Small credit cost badge ─────────────────────────────────────────────────

const CreditBadge = ({ cost, theme = 'default' }) => {
  const isRetroDesktopTheme = theme === 'retro-desktop';

  if (!cost || cost <= 1) return null;
  return (
    <Box
      as="span"
      px={1.5}
      py={0.5}
      borderRadius="sm"
      fontSize="10px"
      fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
      fontWeight="bold"
      color={isRetroDesktopTheme ? '#7a3f00' : '#FFCC00'}
      bg={isRetroDesktopTheme ? '#f1dfbb' : 'rgba(255, 204, 0, 0.15)'}
      border={isRetroDesktopTheme ? '1px solid #a57d4f' : '1px solid rgba(255, 204, 0, 0.4)'}
      boxShadow={
        isRetroDesktopTheme
          ? 'inset 1px 1px 0 rgba(255,255,255,0.62), inset -1px -1px 0 rgba(165,125,79,0.24)'
          : '0 0 4px rgba(255, 204, 0, 0.2)'
      }
    >
      {cost}x
    </Box>
  );
};

export default ModelSelector;
