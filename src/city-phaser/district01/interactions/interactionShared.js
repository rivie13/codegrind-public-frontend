import { PATH_CHOICE_CITY_ENTRY } from '../../../utils/navigation/apartmentEntryState';
import { normalizeCityMissionState } from '../../../utils/navigation/cityStoryState';

const PATH_CHOICE_ROUTE_OBJECTIVES = {
  beginner: {
    contact: {
      accentLabel: 'Incoming comm // Sysadmin',
      statusLabel: 'Learning route',
      text: 'The Sysadmin: "There\'s a sandbox rig down the block in District 01. Start there. Learn on something that won\'t bite your hand off the second you mistype a loop."\n\nThe Sysadmin: "The broker office across the street runs live lines into corporate junk. You can look at it if you want. I wouldn\'t plug in yet unless you\'re in the mood to get humbled by a machine."',
      title: 'Sysadmin Signal',
      typingProfile: 'sysadmin',
    },
    objective: {
      footer:
        'First objective: Visit the Street Sandbox and start the first real learning run. The broker office is visible, but it is not your first stop.',
      targetLabel: 'Street Sandbox',
      targetPointId: 'learning-path',
      text: 'Visit the Street Sandbox and start the first real learning run.',
    },
  },
  pro: {
    contact: {
      accentLabel: 'Incoming comm // Fixer',
      statusLabel: 'Broker route',
      text: 'The Fixer: "District 01 still has one useful thing in it: a broker line feeding a live hiring subnet. Sloppy. Old. Very breakable. Head to the Broker\'s Core and we\'ll walk your token through the side door."\n\nThe Fixer: "If you want to steady your hands first, the sandbox across the street is still there. Even experienced operators run refresher drills. I won\'t tell anyone."',
      title: 'Fixer Signal',
      typingProfile: 'fixer',
    },
    objective: {
      footer:
        "First objective: Visit the Broker's Core and tap the first live line. The sandbox is still there if you want a refresher first.",
      targetLabel: "Broker's Core",
      targetPointId: 'cluster-map',
      text: "Visit the Broker's Core and tap the first live line.",
    },
  },
};

const buildCompactObjectiveText = (objectiveText) => `OBJ: ${objectiveText}`;

const clampCoordinate = (value, min, max) => {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);

  return Math.min(Math.max(value, lowerBound), upperBound);
};

const buildAmbientObjectiveHudState = (scene, ambientObjective) => {
  const objectiveText =
    ambientObjective?.text || 'Move through the district and use the phone map to pin a route.';
  const mappedTargetPointId = scene.getMapPointConfig(ambientObjective?.targetPointId)?.id || null;

  return {
    accentLabel: ambientObjective?.accentLabel || null,
    districtLocationLabel: scene.getDistrictLocationHudLabel(),
    footer: ambientObjective?.footer || null,
    hotkey: ambientObjective?.hotkey || null,
    iconSrc: scene.getPreviewHudIconPath(ambientObjective?.hudIcon || 'info'),
    mode: 'objective',
    phoneObjectiveAccentLabel: ambientObjective?.phoneObjectiveAccentLabel || 'Objective',
    phoneObjectiveStatusLabel: ambientObjective?.phoneObjectiveStatusLabel || 'Objective',
    phoneObjectiveText: ambientObjective?.phoneObjectiveText || objectiveText,
    phoneObjectiveTitle:
      ambientObjective?.phoneObjectiveTitle || ambientObjective?.title || 'Current Objective',
    placement: ambientObjective?.placement || 'top-left',
    presentation: 'compact-objective',
    statusLabel: ambientObjective?.statusLabel || 'Objective',
    targetLabel: ambientObjective?.targetLabel || null,
    targetPointId: mappedTargetPointId,
    text: buildCompactObjectiveText(objectiveText),
    title: ambientObjective?.title || 'Current Objective',
    typewriterEnabled: false,
  };
};

const buildRouteMissionObjective = (previewBridge) => {
  const routeMissionState = normalizeCityMissionState(
    previewBridge?.guestPhoneContext?.routeMissionState
  );
  if (!routeMissionState) {
    return null;
  }

  const progressLabel =
    routeMissionState.solvedCount != null && routeMissionState.totalCount != null
      ? ` ${routeMissionState.solvedCount}/${routeMissionState.totalCount} complete.`
      : '';

  if (routeMissionState.surface === 'learning') {
    return {
      footer: 'Resume the pinned learning route from the Street Sandbox terminal.',
      targetLabel: 'Street Sandbox',
      targetPointId: routeMissionState.targetPointId || 'learning-path',
      text: `Resume the pinned learning route.${progressLabel}`,
      title: 'Current Objective',
    };
  }

  if (routeMissionState.surface === 'clusters') {
    return {
      footer: "Resume the pinned fixer contract from the Broker's Core terminal.",
      targetLabel: "Broker's Core",
      targetPointId: routeMissionState.targetPointId || 'cluster-map',
      text: `Resume the pinned fixer contract.${progressLabel}`,
      title: 'Current Objective',
    };
  }

  return null;
};

const getPostPathChoiceObjective = (previewBridge, previewLocationId) => {
  const selectedTrialTrack =
    typeof previewBridge?.guestPhoneContext?.selectedTrialTrack === 'string'
      ? previewBridge.guestPhoneContext.selectedTrialTrack.trim().toLowerCase()
      : '';

  const entry =
    typeof previewBridge?.entry === 'string' ? previewBridge.entry.replace(/_/g, '-') : '';

  if (
    entry !== PATH_CHOICE_CITY_ENTRY ||
    previewBridge?.apartmentEntryState !== 'hub' ||
    previewLocationId !== 'apartment-room-01'
  ) {
    return null;
  }

  return PATH_CHOICE_ROUTE_OBJECTIVES[selectedTrialTrack] || null;
};

const resolveRouteSurfaceTargetPath = ({ guestPhoneContext, routeSurface }) => {
  if (!routeSurface) {
    return '';
  }

  const routeMissionState = normalizeCityMissionState(guestPhoneContext?.routeMissionState);

  if (routeMissionState?.surface === routeSurface && routeMissionState.resumePath) {
    return routeMissionState.resumePath;
  }

  if (routeSurface === 'learning') {
    const selectedTrialLearningPath =
      typeof guestPhoneContext?.selectedTrialLearningPath === 'string'
        ? guestPhoneContext.selectedTrialLearningPath.trim()
        : '';

    return selectedTrialLearningPath ? `/learning/${selectedTrialLearningPath}` : '/learning';
  }

  if (routeSurface === 'clusters') {
    return '/games/clusters';
  }

  if (routeSurface === 'store') {
    return '/store';
  }

  return '';
};

const buildTerminalLaunchRequest = ({ interactionConfig, interactionName, previewBridge }) => {
  const targetPath = resolveRouteSurfaceTargetPath({
    guestPhoneContext: previewBridge?.guestPhoneContext,
    routeSurface: interactionConfig?.routeSurface,
  });

  if (!targetPath) {
    return null;
  }

  return {
    programId: interactionConfig?.terminalName || 'Port Meridian Terminal',
    source: 'city-preview-terminal',
    targetPath,
    terminalInstanceId: interactionName,
    terminalName: interactionConfig?.terminalName || 'Port Meridian Terminal',
  };
};

export {
  PATH_CHOICE_ROUTE_OBJECTIVES,
  buildCompactObjectiveText,
  clampCoordinate,
  buildAmbientObjectiveHudState,
  buildRouteMissionObjective,
  getPostPathChoiceObjective,
  resolveRouteSurfaceTargetPath,
  buildTerminalLaunchRequest,
};
