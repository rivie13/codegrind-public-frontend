import { useEffect, useMemo } from 'react';

import { GRID_COLS, GRID_ROWS } from '../../constants';

export default function useTowerDefenseV2MapState({
  activeTitleSlug,
  fallbackGridCols = GRID_COLS,
  fallbackGridRows = GRID_ROWS,
  generatedMap,
  pathOverride,
  setPathOverride,
}) {
  const basePathLength = useMemo(() => {
    if (!generatedMap) return 0;
    const basePath = generatedMap.pathNodes || generatedMap.path || [];
    return Array.isArray(basePath) ? basePath.length : 0;
  }, [generatedMap]);

  useEffect(() => {
    setPathOverride(null);
  }, [activeTitleSlug, setPathOverride]);

  const activeMap = useMemo(() => {
    if (!generatedMap?.pathNodes?.length) {
      return null;
    }

    if (!pathOverride?.length) {
      return generatedMap;
    }

    return {
      ...generatedMap,
      pathNodes: pathOverride,
      path: pathOverride,
    };
  }, [generatedMap, pathOverride]);

  const pathNodes = useMemo(() => {
    if (!activeMap) {
      return [];
    }
    return activeMap.pathNodes || activeMap.path || [];
  }, [activeMap]);

  const isMapLoading = Boolean(activeTitleSlug) && !activeMap;

  const gridRows = useMemo(() => {
    if (!activeMap) {
      return fallbackGridRows || GRID_ROWS;
    }
    if (Array.isArray(activeMap.map)) {
      return activeMap.map.length || fallbackGridRows || GRID_ROWS;
    }
    return activeMap.map?.rows || fallbackGridRows || GRID_ROWS;
  }, [activeMap, fallbackGridRows]);

  const gridCols = useMemo(() => {
    if (!activeMap) {
      return fallbackGridCols || GRID_COLS;
    }
    if (Array.isArray(activeMap.map)) {
      return activeMap.map[0]?.length || fallbackGridCols || GRID_COLS;
    }
    return activeMap.map?.cols || fallbackGridCols || GRID_COLS;
  }, [activeMap, fallbackGridCols]);

  return {
    activeMap,
    basePathLength,
    gridCols,
    gridRows,
    isMapLoading,
    pathNodes,
  };
}
