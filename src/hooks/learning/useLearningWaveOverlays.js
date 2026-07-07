/**
 * useLearningWaveOverlays.js — Maps learn-node teaching sections to TD wave transitions.
 *
 * When a tower node plays during a learning path session, this hook:
 * 1. Finds the "learn" node in the same module
 * 2. Extracts its content.sections (text, examples, etc.)
 * 3. Maps sections to wave transitions (section 0 → before wave 1, section 1 → after wave 1, …)
 * 4. Exposes the current overlay content and a dismiss function
 *
 * The Start Wave button should be hidden while an overlay is active.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * @param {Object} options
 * @param {Object|null} options.learningPathData  - Full path data (modules + nodes)
 * @param {string|null} options.learningNodeId    - Current tower node ID (e.g. "py-m1-tower")
 * @param {Object}      options.gameState         - Current TD game state ({ status, wave })
 * @param {boolean}     options.isLearningMode    - True when playing inside a learning path
 * @returns {{ activeOverlay: Object|null, dismissOverlay: Function, isOverlayActive: boolean }}
 */
export default function useLearningWaveOverlays({
  learningPathData,
  learningNodeId,
  gameState,
  isLearningMode,
}) {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const shownSectionIds = useRef(new Set());
  const lastWaveShown = useRef(-1);
  const dismissedForWave = useRef(-1);

  // Find the learn node in the same module as the current tower node
  const teachingSections = useMemo(() => {
    if (!isLearningMode || !learningPathData?.modules || !learningNodeId) return [];

    // Find the module containing the current tower node
    let targetModule = null;
    for (const mod of learningPathData.modules) {
      if (mod.nodes?.some((n) => n.nodeId === learningNodeId)) {
        targetModule = mod;
        break;
      }
    }
    if (!targetModule) return [];

    // Find the learn node in that module
    const learnNode = targetModule.nodes?.find((n) => n.type === 'learn');
    if (!learnNode?.content?.sections) return [];

    // Filter to show-able sections (text and example types, skip pure giphy)
    return learnNode.content.sections.filter((s) => s.type === 'text' || s.type === 'example');
  }, [isLearningMode, learningPathData, learningNodeId]);

  // Map wave transitions to sections:
  // - section[0] → shown at READY (before wave 1),   waveIndex = 0
  // - section[1] → shown at WAVE_COMPLETE after wave 1,  waveIndex = 1
  // - section[2] → shown at WAVE_COMPLETE after wave 2,  waveIndex = 2
  // - etc.
  // If there are more sections than waves, batch remaining into the last overlay.

  const getSectionsForWave = useCallback(
    (waveIndex) => {
      if (!teachingSections.length) return null;

      // If only 1 section, show it before wave 1
      if (teachingSections.length === 1 && waveIndex === 0) {
        return !shownSectionIds.current.has(teachingSections[0].id) ? [teachingSections[0]] : null;
      }

      // For N sections, spread them across the first N wave transitions
      // waveIndex 0 = before wave 1 (READY state)
      // waveIndex K = after wave K completes
      const totalSlots = gameState.totalWaves || teachingSections.length;
      const sectionsPerSlot = Math.max(1, Math.ceil(teachingSections.length / totalSlots));
      const start = waveIndex * sectionsPerSlot;
      const end = Math.min(start + sectionsPerSlot, teachingSections.length);

      if (start >= teachingSections.length) return null;

      const pending = teachingSections
        .slice(start, end)
        .filter((s) => !shownSectionIds.current.has(s.id));

      return pending.length > 0 ? pending : null;
    },
    [teachingSections, gameState.totalWaves]
  );

  // Show overlay when entering READY or WAVE_COMPLETE in learning mode
  useEffect(() => {
    if (!isLearningMode || !teachingSections.length) return;

    const { status, wave } = gameState;
    let waveIndex = -1;

    if (status === 'ready' && wave === 1) {
      // Before first wave
      waveIndex = 0;
    } else if (status === 'wave-complete') {
      // After wave N
      waveIndex = wave;
    }

    if (waveIndex < 0) return;
    if (waveIndex === lastWaveShown.current) return;
    if (waveIndex === dismissedForWave.current) return;

    const sections = getSectionsForWave(waveIndex);
    if (!sections) return;

    lastWaveShown.current = waveIndex;
    setActiveOverlay({
      waveIndex,
      sections,
      total: teachingSections.length,
      shownSoFar: shownSectionIds.current.size,
    });
    // We intentionally depend on gameState.status and gameState.wave rather than
    // the full gameState object to avoid unnecessary re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.status, gameState.wave, isLearningMode, teachingSections, getSectionsForWave]);

  const dismissOverlay = useCallback(() => {
    if (activeOverlay) {
      for (const s of activeOverlay.sections) {
        shownSectionIds.current.add(s.id);
      }
      dismissedForWave.current = activeOverlay.waveIndex;
    }
    setActiveOverlay(null);
  }, [activeOverlay]);

  return {
    activeOverlay,
    dismissOverlay,
    isOverlayActive: activeOverlay !== null,
    totalTeachingSections: teachingSections.length,
  };
}
