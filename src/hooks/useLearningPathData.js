import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import logger from '../utils/core/logger';
import { normalizeLearningPath } from '../data/learningPathRegistry';

const pathCache = new Map();
const inflight = new Map();

const normalizeSlug = (slug) => {
  if (!slug) return null;
  const trimmed = String(slug).trim();
  if (!trimmed) return null;
  return trimmed.endsWith('-path') ? trimmed : `${trimmed}-path`;
};

const fetchPathData = async (pathId) => {
  const raw = await api.learningPath.getPath(pathId);
  return normalizeLearningPath(raw);
};

export default function useLearningPathData(pathSlug) {
  const pathId = useMemo(() => normalizeSlug(pathSlug), [pathSlug]);
  const [pathData, setPathData] = useState(() => (pathId ? pathCache.get(pathId) || null : null));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(pathId && !pathCache.has(pathId)));

  const refresh = useCallback(async () => {
    if (!pathId) return null;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPathData(pathId);
      pathCache.set(pathId, data);
      setPathData(data);
      return data;
    } catch (err) {
      logger.warn('Failed to refresh learning path data');
      logger.debug(err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => {
    if (!pathId) {
      setPathData(null);
      setLoading(false);
      return;
    }

    if (pathCache.has(pathId)) {
      setPathData(pathCache.get(pathId));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const request = inflight.get(pathId) || fetchPathData(pathId);
    inflight.set(pathId, request);

    request
      .then((data) => {
        if (cancelled) return;
        pathCache.set(pathId, data);
        setPathData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('Failed to load learning path data');
        logger.debug(err);
        setError(err);
      })
      .finally(() => {
        inflight.delete(pathId);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathId]);

  return {
    pathData,
    loading,
    error,
    refresh,
    pathId
  };
}