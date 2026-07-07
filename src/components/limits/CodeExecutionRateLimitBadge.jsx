import { Badge, Box, HStack, Text, Tooltip } from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

const buildDefaultState = () => ({
  limit: 0,
  remaining: 0,
  extraCredits: 0,
  totalRemaining: 0,
  resetIn: 0,
  resetPeriod: 0,
  unlimited: false,
  adCooldownRemaining: 0,
  loading: true,
});

const formatResetTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'soon';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export default function CodeExecutionRateLimitBadge({
  rateLimit,
  refreshIntervalMs = 30000,
  label = 'Exec',
}) {
  const [state, setState] = useState(buildDefaultState);

  const applyRateLimit = useCallback((payload) => {
    if (!payload) return;
    const isUnlimited = Boolean(payload.unlimited);
    setState({
      limit: payload.limit || 0,
      remaining: payload.remaining ?? 0,
      extraCredits: payload.extraCredits || 0,
      totalRemaining: (payload.totalRemaining ?? payload.remaining) || 0,
      resetIn: payload.resetIn || 0,
      resetPeriod: payload.resetPeriod || 0,
      unlimited: isUnlimited,
      adCooldownRemaining: isUnlimited ? 0 : payload.adCooldownRemaining || 0,
      loading: false,
    });
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.codeExecution.getRateLimitStatus();
      if (response?.rateLimit) {
        applyRateLimit(response.rateLimit);
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [applyRateLimit]);

  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [fetchStatus, refreshIntervalMs]);

  useEffect(() => {
    if (rateLimit) {
      applyRateLimit(rateLimit);
    }
  }, [rateLimit, applyRateLimit]);

  useEffect(() => {
    if (state.unlimited || state.adCooldownRemaining <= 0) return;

    const intervalId = setInterval(() => {
      setState((prev) => {
        if (prev.adCooldownRemaining <= 1) {
          return { ...prev, adCooldownRemaining: 0 };
        }
        return { ...prev, adCooldownRemaining: prev.adCooldownRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [state.unlimited, state.adCooldownRemaining]);

  const effectiveRemaining = useMemo(
    () => (state.unlimited ? Number.POSITIVE_INFINITY : (state.totalRemaining ?? state.remaining)),
    [state.unlimited, state.totalRemaining, state.remaining]
  );

  const badgeColor = useMemo(() => {
    if (state.loading) return { color: 'var(--cg-muted)', bg: 'var(--cg-window)' };
    if (state.unlimited) return { color: 'var(--cg-accent-green)', bg: 'rgba(36, 106, 42, 0.14)' };
    if (effectiveRemaining === 0)
      return { color: 'var(--cg-accent-red)', bg: 'rgba(139, 31, 31, 0.14)' };
    if (state.limit > 0 && effectiveRemaining < state.limit * 0.3) {
      return { color: 'var(--cg-accent-amber)', bg: 'rgba(118, 81, 0, 0.14)' };
    }
    if (state.limit > 0 && effectiveRemaining < state.limit * 0.7) {
      return { color: 'var(--cg-link)', bg: 'rgba(10, 56, 154, 0.12)' };
    }
    return { color: 'var(--cg-accent-green)', bg: 'rgba(36, 106, 42, 0.14)' };
  }, [state.loading, state.unlimited, effectiveRemaining, state.limit]);

  return (
    <HStack spacing={2} align="center">
      <Tooltip
        label={
          state.loading
            ? 'Loading execution limits...'
            : state.unlimited
              ? 'Code execution: Unlimited access.'
              : `Code execution: ${effectiveRemaining}/${state.limit} remaining. Resets in ${formatResetTime(state.resetIn)}${state.adCooldownRemaining > 0 ? `. Ad cooldown: ${formatResetTime(state.adCooldownRemaining)}.` : '.'}`
        }
        placement="top"
      >
        <Badge
          bg={badgeColor.bg}
          color={badgeColor.color}
          px={2}
          py={1}
          border="1px solid var(--cg-window-dark)"
          boxShadow="var(--cg-window-outset)"
        >
          {label}:{' '}
          {state.loading
            ? '...'
            : state.unlimited
              ? 'Unlimited'
              : `${effectiveRemaining}/${state.limit}`}
        </Badge>
      </Tooltip>
      {!state.loading && !state.unlimited && state.extraCredits > 0 && (
        <Box>
          <Text fontSize="xs" color="var(--cg-muted)">
            +{state.extraCredits} ad credits
          </Text>
        </Box>
      )}
      {!state.loading && !state.unlimited && state.adCooldownRemaining > 0 && (
        <Box>
          <Text fontSize="xs" color="var(--cg-accent-amber)">
            Ad cooldown: {formatResetTime(state.adCooldownRemaining)}
          </Text>
        </Box>
      )}
    </HStack>
  );
}
