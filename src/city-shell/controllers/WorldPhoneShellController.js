import ApartmentIntroPhoneShellController, {
  buildClusterPreviewCopy,
  buildLearningPreviewCopy,
  buildObjectiveCopy,
} from './ApartmentIntroPhoneShellController';
import BasePhoneShellController from './BasePhoneShellController';
import { buildCityPreviewCollectiblePhoneState } from '../../city-phaser/district01/cityPreviewCollectibles';
import getAssetUrl from '../../utils/assets/assetUrl';

const normalizeWorldMarkers = (previewWorldState) =>
  Array.isArray(previewWorldState?.markers) ? previewWorldState.markers : [];

const normalizeOwnedCityCollectibleSlugs = (ownedCityCollectibleSlugs) => [
  ...new Set(
    (Array.isArray(ownedCityCollectibleSlugs) ? ownedCityCollectibleSlugs : [])
      .filter((slug) => typeof slug === 'string' && slug.trim())
      .map((slug) => slug.trim())
  ),
];

const normalizeWorldState = (previewWorldState) => {
  if (!previewWorldState || typeof previewWorldState !== 'object') {
    return null;
  }

  return {
    ...previewWorldState,
    activeWaypointId:
      typeof previewWorldState.activeWaypointId === 'string'
        ? previewWorldState.activeWaypointId
        : null,
    markers: normalizeWorldMarkers(previewWorldState),
    objectivePointId:
      typeof previewWorldState.objectivePointId === 'string'
        ? previewWorldState.objectivePointId
        : null,
    player:
      previewWorldState.player && typeof previewWorldState.player === 'object'
        ? previewWorldState.player
        : null,
  };
};

const findWorldMarker = (previewWorldState, pointId) => {
  if (typeof pointId !== 'string' || !pointId.trim()) {
    return null;
  }

  return normalizeWorldMarkers(previewWorldState).find((marker) => marker.id === pointId) || null;
};

const resolveSelectedLearningPath = (guestPhoneContext = {}) => {
  const selectedTrialLearningPath =
    typeof guestPhoneContext.selectedTrialLearningPath === 'string'
      ? guestPhoneContext.selectedTrialLearningPath.trim()
      : '';

  return selectedTrialLearningPath || null;
};

const resolveWorldRouteTargetPath = ({ guestPhoneContext, routeSurface }) => {
  if (routeSurface === 'learning') {
    const selectedLearningPath = resolveSelectedLearningPath(guestPhoneContext);
    return selectedLearningPath ? `/learning/${selectedLearningPath}` : '/learning';
  }

  if (routeSurface === 'clusters') {
    return '/games/clusters';
  }

  if (routeSurface === 'store') {
    return '/store';
  }

  return null;
};

const buildPhoneObjectiveState = ({ previewHudState, previewWorldState }) => {
  const objectiveCopy = buildObjectiveCopy(previewHudState);
  const worldState = normalizeWorldState(previewWorldState);
  const hasExplicitTargetPointId = Object.prototype.hasOwnProperty.call(
    previewHudState || {},
    'targetPointId'
  );
  const targetPointId = hasExplicitTargetPointId
    ? typeof previewHudState?.targetPointId === 'string' && previewHudState.targetPointId.trim()
      ? previewHudState.targetPointId.trim()
      : null
    : worldState?.objectivePointId || null;
  const objectiveMarker = findWorldMarker(worldState, targetPointId);

  return {
    accentLabel:
      previewHudState?.phoneObjectiveAccentLabel || previewHudState?.accentLabel || 'Objective',
    footer: previewHudState?.footer || objectiveCopy.launchNote,
    hotkey: previewHudState?.hotkey || null,
    statusLabel:
      previewHudState?.phoneObjectiveStatusLabel || previewHudState?.statusLabel || 'Objective',
    targetLabel: previewHudState?.targetLabel || objectiveMarker?.label || null,
    targetPath: objectiveMarker?.targetPath || null,
    targetPointId,
    text: previewHudState?.phoneObjectiveText || previewHudState?.text || objectiveCopy.detail,
    title: previewHudState?.phoneObjectiveTitle || previewHudState?.title || 'Objective Brief',
  };
};

const buildWorldProgramApp = (programLaunchRequest) => {
  if (!programLaunchRequest || typeof programLaunchRequest !== 'object') {
    return null;
  }

  const programId = String(programLaunchRequest.programId || '').trim() || 'linked-program.exe';
  const label = String(programLaunchRequest.label || programId).trim() || programId;

  return {
    id: 'terminal-program',
    iconLabel: 'APP',
    label,
    action: 'launch-program',
    badge: 'Ready',
    description: 'A linked terminal program is ready from the handset.',
    detail:
      'Launch the synced terminal program from the same phone layout you use across Port Meridian.',
    dockOrder: 0,
    launchNote: `${label} is ready to launch from the field device.`,
    launchRequest: programLaunchRequest,
    programId,
    showOnHome: false,
    windowTitle: label,
  };
};

const TRACK_LABELS = {
  beginner: 'Beginner track',
  pro: 'Pro track',
};

const LEARNING_PATH_LABELS = {
  'csharp-path': 'C# path',
  'cpp-path': 'C++ path',
  'go-path': 'Go path',
  'javascript-path': 'JavaScript path',
  'python-path': 'Python path',
};

const formatCountLabel = (count, singular, plural = `${singular}s`) => {
  const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Math.floor(Number(count))) : 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
};

const resolveTrackLabel = (trackId) => TRACK_LABELS[trackId] || 'Current track';

const resolveLearningPathLabel = (pathId) => LEARNING_PATH_LABELS[pathId] || 'Learning path';

const buildLearningPreviewPresentation = ({
  guestPhoneContext,
  learningCopy,
  previewWorldState,
}) => {
  const locationLabel = previewWorldState?.locationLabel || 'Apartment Safehouse';
  const selectedLearningPath = resolveSelectedLearningPath(guestPhoneContext);
  const progressSummary =
    guestPhoneContext?.progressSummary && typeof guestPhoneContext.progressSummary === 'object'
      ? guestPhoneContext.progressSummary
      : null;
  const pathLabel = selectedLearningPath
    ? resolveLearningPathLabel(selectedLearningPath)
    : 'Learning path';
  const trialSolvedCount =
    typeof progressSummary?.learningTrialSolvedCount === 'number'
      ? progressSummary.learningTrialSolvedCount
      : null;
  const trialProblemLimit =
    typeof progressSummary?.learningTrialProblemLimit === 'number'
      ? progressSummary.learningTrialProblemLimit
      : null;
  const trialProblemsRemaining =
    typeof progressSummary?.learningTrialProblemsRemaining === 'number'
      ? progressSummary.learningTrialProblemsRemaining
      : null;
  const detail =
    selectedLearningPath && trialSolvedCount != null && trialProblemLimit != null
      ? `${pathLabel} is active from ${locationLabel}. Module 0 preview shows ${trialSolvedCount} of ${trialProblemLimit} trial problems cleared, ${trialProblemsRemaining} remaining in the current set.`
      : learningCopy.detail;

  return {
    cards: [
      {
        title: 'Current Route',
        body: selectedLearningPath
          ? `${locationLabel} is your current field position. ${pathLabel} is the active learning route on this handset.`
          : `${locationLabel} is your current field position. Pick a learning path to lock the next route preview.`,
      },
      {
        title: 'Learning Track',
        body: detail,
      },
      {
        title: 'Module Progress',
        body: progressSummary
          ? `${formatCountLabel(progressSummary.learningNodesCompletedCount, 'learning node')} completed and ${formatCountLabel(progressSummary.learningNodesStartedCount, 'learning node')} visited from the phone route.`
          : 'Open the full learning landing page when you want the complete route and course list.',
      },
    ],
    detail,
  };
};

const buildClusterPreviewPresentation = ({ guestPhoneContext, clusterCopy, previewWorldState }) => {
  const locationLabel = previewWorldState?.locationLabel || 'Apartment Safehouse';
  const selectedTrialTrack =
    typeof guestPhoneContext?.selectedTrialTrack === 'string'
      ? guestPhoneContext.selectedTrialTrack
      : null;
  const progressSummary =
    guestPhoneContext?.progressSummary && typeof guestPhoneContext.progressSummary === 'object'
      ? guestPhoneContext.progressSummary
      : null;
  const trackLabel = resolveTrackLabel(selectedTrialTrack);
  const clusterTrialSolvedCount =
    typeof progressSummary?.clusterTrialSolvedCount === 'number'
      ? progressSummary.clusterTrialSolvedCount
      : 0;
  const clusterTrialProblemLimit =
    typeof progressSummary?.clusterTrialProblemLimit === 'number'
      ? progressSummary.clusterTrialProblemLimit
      : 3;
  const clusterFreeProblemsRemaining =
    typeof progressSummary?.clusterFreeProblemsRemaining === 'number'
      ? progressSummary.clusterFreeProblemsRemaining
      : clusterTrialProblemLimit;
  const detail =
    selectedTrialTrack === 'pro' || (progressSummary?.clustersBrowsedCount || 0) > 0
      ? `${trackLabel} is active from ${locationLabel}. Cluster preview shows ${clusterTrialSolvedCount} of ${clusterTrialProblemLimit} trial breaches cleared, ${clusterFreeProblemsRemaining} remaining in the current set.`
      : clusterCopy.detail;

  return {
    cards: [
      {
        title: 'Current Route',
        body: `${locationLabel} is your current field position. ${trackLabel} governs the cluster handoff from this phone.`,
      },
      {
        title: 'Cluster Preview',
        body: detail,
      },
      {
        title: 'Cluster Progress',
        body: progressSummary
          ? `${formatCountLabel(progressSummary.clustersBrowsedCount, 'cluster')} browsed and ${formatCountLabel(progressSummary.clusterTrialSolvedCount, 'trial breach', 'trial breaches')} cleared from the preview route.`
          : 'Open the games landing page when you want the full cluster or game surface.',
      },
    ],
    detail,
  };
};

const buildCollectiblesPresentation = ({ ownedCityCollectibleSlugs, previewWorldState }) => {
  const worldState = normalizeWorldState(previewWorldState);
  const phoneState = buildCityPreviewCollectiblePhoneState({
    locationId: worldState?.locationId,
    ownedSlugs: ownedCityCollectibleSlugs,
  });
  const districtSummary = phoneState || worldState?.districtCollectibles || null;

  if (!districtSummary) {
    return {
      badge: 'Sync',
      cards: [
        {
          body: 'The collectible archive is waiting on district sync data from the field scene.',
          eyebrow: 'Archive offline',
          title: 'Collectibles Archive',
        },
      ],
      detail: 'Collectible archive data is not available in this scene yet.',
    };
  }

  const collectedLabel = formatCountLabel(districtSummary.collectedCount, 'collectible');
  const remainingLabel = formatCountLabel(districtSummary.remainingCount, 'collectible');
  const totalLabel = formatCountLabel(districtSummary.totalCount, 'collectible');
  const cards = [
    {
      body:
        districtSummary.totalCount > 0
          ? `${districtSummary.districtLabel} has ${totalLabel} in the current archive. You have recovered ${collectedLabel} so far.`
          : `${districtSummary.districtLabel} does not have any registered collectibles yet.`,
      eyebrow: 'Recovered collectibles',
      footer:
        districtSummary.totalCount > 0
          ? districtSummary.remainingCount > 0
            ? `${remainingLabel} still missing from the district cache.`
            : 'District archive complete. Every collectible in this district is recovered.'
          : 'No field records are registered here yet.',
      title: `${districtSummary.districtLabel} Archive`,
    },
  ];

  if (phoneState?.ownedCollectibles?.length) {
    cards.push(
      ...phoneState.ownedCollectibles.map((collectible) => ({
        body: collectible.description,
        eyebrow: collectible.categoryLabel,
        footer: collectible.footer,
        imageAlt: collectible.imageAlt,
        imageSrc: collectible.imageSrc,
        title: collectible.title,
      }))
    );
  } else {
    cards.push({
      body: `You have not recovered any ${districtSummary.districtLabel} collectibles yet. Pick up a field cache to archive its picture and note on this phone.`,
      eyebrow: 'Archive empty',
      title: 'No Recovered Files',
    });
  }

  return {
    badge:
      districtSummary.totalCount > 0
        ? `${districtSummary.collectedCount}/${districtSummary.totalCount}`
        : '0/0',
    cards,
    detail:
      phoneState?.ownedCollectibles?.length > 0
        ? `Review ${collectedLabel} archived from ${districtSummary.districtLabel}.`
        : `No archived collectibles recovered from ${districtSummary.districtLabel} yet.`,
  };
};

const buildLeaveWorldApp = ({
  appId,
  description,
  detail,
  guestPhoneContext,
  iconLabel,
  label,
  programId,
  targetPath,
  windowTitle,
}) => {
  const isAuthenticated = guestPhoneContext?.isAuthenticated === true;
  const profileRouteRequiresHome = appId === 'profile' && !isAuthenticated;
  const resolvedTargetPath = profileRouteRequiresHome ? '/' : targetPath;
  const actionLabel =
    appId === 'profile'
      ? profileRouteRequiresHome
        ? 'Go to Site Home'
        : 'Open Profile'
      : `Open ${label}`;
  const routeBody =
    appId === 'profile' && profileRouteRequiresHome
      ? 'You are not signed in, so leaving the city shell sends you to Site Home instead of the profile dashboard.'
      : `This route leaves Port Meridian and opens the full ${label.toLowerCase()} page outside the city shell.`;

  return {
    id: appId,
    iconLabel,
    label,
    badge: profileRouteRequiresHome ? 'Sign in' : 'Leave',
    cards: [
      {
        title: 'Leave Port Meridian?',
        body: `Opening ${label} exits the in-world phone shell and switches to the full site surface.`,
      },
      {
        title: profileRouteRequiresHome ? 'Sign-in check' : 'Return Path',
        body: profileRouteRequiresHome
          ? routeBody
          : `${routeBody} Use Back to Game if you want to stay inside the apartment run.`,
      },
    ],
    description,
    detail: profileRouteRequiresHome
      ? 'Guests are routed to Site Home first so they can sign in before opening Profile.'
      : detail,
    actions: [
      {
        id: `open-${appId}`,
        label: actionLabel,
        type: 'launch-program',
        programId: profileRouteRequiresHome ? 'Home' : programId,
        targetPath: resolvedTargetPath,
      },
    ],
    launchNote: profileRouteRequiresHome
      ? 'Site Home opened so you can sign in before returning to the city profile.'
      : `${label} opened. Leaving the city shell.`,
    windowTitle,
  };
};

const createWorldPhoneApps = ({
  guestPhoneContext,
  objectiveState,
  ownedCityCollectibleSlugs,
  previewHudState,
  previewWorldState,
  programLaunchRequest,
  tunnelLaunchRequest,
}) => {
  const objectiveCopy = buildObjectiveCopy(previewHudState);
  const learningCopy = buildLearningPreviewCopy(guestPhoneContext);
  const clusterCopy = buildClusterPreviewCopy(guestPhoneContext);
  const programApp = buildWorldProgramApp(programLaunchRequest);
  const worldState = normalizeWorldState(previewWorldState);
  const learningPreviewPresentation = buildLearningPreviewPresentation({
    guestPhoneContext,
    learningCopy,
    previewWorldState: worldState,
  });
  const clusterPreviewPresentation = buildClusterPreviewPresentation({
    clusterCopy,
    guestPhoneContext,
    previewWorldState: worldState,
  });
  const collectiblesPresentation = buildCollectiblesPresentation({
    ownedCityCollectibleSlugs: normalizeOwnedCityCollectibleSlugs(ownedCityCollectibleSlugs),
    previewWorldState: worldState,
  });
  const objectiveTargetLabel = objectiveState?.targetLabel || 'the current objective';
  const activeWaypointId = worldState?.activeWaypointId || null;
  const learningTargetPath = resolveWorldRouteTargetPath({
    guestPhoneContext,
    routeSurface: 'learning',
  });
  const clusterTargetPath = resolveWorldRouteTargetPath({
    guestPhoneContext,
    routeSurface: 'clusters',
  });
  const objectiveActions = objectiveState?.targetPointId
    ? [
        {
          id: 'pin-objective',
          appId: 'objective',
          label:
            activeWaypointId === objectiveState.targetPointId ? 'Unpin Objective' : 'Pin Objective',
          type: 'set-waypoint',
          waypoint: {
            pointId:
              activeWaypointId === objectiveState.targetPointId
                ? null
                : objectiveState.targetPointId,
          },
        },
      ]
    : [];

  return [
    ...(programApp ? [programApp] : []),
    {
      id: 'learning',
      iconLabel: 'LP',
      label: 'Learning',
      badge: learningCopy.badge || 'Preview',
      cards: learningPreviewPresentation.cards,
      description: 'Preview the current learning-path state from the field device.',
      detail: learningPreviewPresentation.detail,
      actions: [
        {
          id: 'open-learning-landing',
          label: 'Open Learning',
          type: 'launch-program',
          programId: 'Learning',
          targetPath: learningTargetPath,
        },
      ],
      launchNote: learningCopy.launchNote,
      windowTitle: 'Learning Preview',
    },
    {
      id: 'clusters',
      iconLabel: 'CL',
      label: 'Clusters',
      badge: clusterCopy.badge || 'Preview',
      cards: clusterPreviewPresentation.cards,
      description: 'Review cluster progress from the handset before you route back out.',
      detail: clusterPreviewPresentation.detail,
      actions: [
        {
          id: 'open-games-landing',
          label: 'Open Games',
          type: 'launch-program',
          programId: 'Games',
          targetPath: clusterTargetPath,
        },
      ],
      launchNote: clusterCopy.launchNote,
      windowTitle: 'Clusters Progress',
    },
    {
      id: 'collectibles',
      iconLabel: 'ARC',
      label: 'Collectibles',
      badge: collectiblesPresentation.badge,
      cards: collectiblesPresentation.cards,
      description: 'Review recovered collectibles, portraits, and field notes from the handset.',
      detail: collectiblesPresentation.detail,
      windowTitle: 'Collectibles Archive',
    },
    buildLeaveWorldApp({
      appId: 'leaderboards',
      description: 'Open the live leaderboards from the same field device shell.',
      detail: 'Route straight into the standings when you want the full site view.',
      guestPhoneContext,
      iconLabel: 'LB',
      label: 'Leaderboards',
      programId: 'Leaderboards',
      targetPath: '/leaderboards',
      windowTitle: 'Leaderboards',
    }),
    buildLeaveWorldApp({
      appId: 'profile',
      description:
        guestPhoneContext?.isAuthenticated === true
          ? 'Review your profile and city stats.'
          : 'Sign in from Home before returning to the city profile dashboard.',
      detail: 'The full record is still on file when you need it.',
      guestPhoneContext,
      iconLabel: 'ME',
      label: 'Profile',
      programId: 'Profile',
      targetPath: '/profile',
      windowTitle: 'Profile',
    }),
    {
      id: 'travel',
      iconLabel: 'MAP',
      label: 'Game Map',
      badge: worldState?.locationLabel ? 'Live' : 'Map',
      cards: [
        {
          title: 'District Map',
          body: worldState?.locationLabel
            ? `${worldState.locationLabel} is linked to the field device. Pin a waypoint or route into a linked district page.`
            : 'Live minimap and waypoint controls are being hydrated from the city bridge.',
        },
      ],
      description: 'Check district routes, objectives, and live POIs from the field device.',
      detail: worldState?.locationLabel
        ? `Review live POIs, your current position, and the next route from ${worldState.locationLabel}.`
        : 'Review where you are, where the objective sits, and what locations are worth routing toward.',
      launchNote: 'Game Map opened.',
      windowTitle: 'District Map',
    },
    {
      id: 'objective',
      iconLabel: 'OBJ',
      label: 'Objective',
      badge: 'Now',
      cards: [
        {
          title: objectiveState?.title || objectiveCopy.description,
          body: objectiveState?.text || objectiveCopy.detail,
        },
        {
          title: objectiveState?.targetLabel ? 'Objective Target' : 'Field Device Ready',
          body: objectiveState?.targetLabel
            ? `${objectiveTargetLabel} is available for waypoint pinning from the phone.`
            : 'Objective route handoff and waypoint controls are being hydrated from the city bridge.',
        },
      ],
      description: objectiveCopy.description,
      detail: objectiveState?.text || objectiveCopy.detail,
      actions: objectiveActions,
      launchNote: objectiveCopy.launchNote,
      windowTitle: 'Objective Brief',
    },
    {
      id: 'settings',
      iconLabel: 'CFG',
      label: 'Game Settings',
      badge: 'Audio',
      description: 'Adjust audio and HUD settings from the phone.',
      detail: 'Tune the field device before you head back out.',
      dockOrder: 1,
      launchNote: 'Game Settings opened.',
      windowTitle: 'Game Settings',
    },
    ...(tunnelLaunchRequest
      ? [
          {
            id: 'tunnel',
            iconLabel: 'TNL',
            label: 'Tunnel',
            action: tunnelLaunchRequest?.targetPath ? 'launch-program' : undefined,
            badge: tunnelLaunchRequest?.targetPath ? 'Linked' : 'Ready',
            description: tunnelLaunchRequest?.targetPath
              ? 'Step from the field device straight into the linked terminal or route.'
              : 'A live terminal nearby can open a tunnel from here.',
            detail: tunnelLaunchRequest?.targetPath
              ? 'The line is synced and ready to carry you through.'
              : 'Move into range of the terminal to bring the line online.',
            dockOrder: 2,
            launchRequest: tunnelLaunchRequest,
            launchNote: tunnelLaunchRequest?.targetPath
              ? 'Tunnel line ready.'
              : 'Tunnel line standing by.',
            showOnHome: false,
            windowTitle: 'Tunnel',
          },
        ]
      : []),
    {
      id: 'resume',
      iconLabel: 'GO',
      label: 'Back to Game',
      action: 'close-shell',
      badge: 'Resume',
      description: 'Put the phone away and return to the same spot in the city.',
      detail: 'Stow the handset when you are ready to head back out.',
      dockOrder: 3,
      launchNote: 'Phone stowed. Back in the city.',
      showOnHome: false,
      windowTitle: 'Back to Game',
    },
  ];
};

class WorldPhoneShellController extends ApartmentIntroPhoneShellController {
  constructor(context = {}) {
    super({
      ...context,
      deviceClass: context.deviceClass || 'phone',
      shellId: context.shellId || 'world-phone',
      terminalName: context.terminalName || 'Port Meridian Field Device',
    });
  }

  createInitialSnapshot() {
    const phoneWorldState = normalizeWorldState(this.context.previewWorldState);
    const phoneObjectiveState = buildPhoneObjectiveState({
      previewHudState: this.context.previewHudState,
      previewWorldState: phoneWorldState,
    });
    const phoneApps = createWorldPhoneApps({
      guestPhoneContext: this.context.guestPhoneContext,
      objectiveState: phoneObjectiveState,
      ownedCityCollectibleSlugs: this.context.ownedCityCollectibleSlugs,
      previewHudState: this.context.previewHudState,
      previewWorldState: phoneWorldState,
      programLaunchRequest: this.context.programLaunchRequest || null,
      tunnelLaunchRequest: this.context.tunnelLaunchRequest || null,
    });

    return {
      ...super.createInitialSnapshot(),
      activeFeedItemId: null,
      activeWaypointId: phoneWorldState?.activeWaypointId || null,
      anomalousFeedItemId: null,
      footerHint:
        this.context.deviceClass === 'desktop'
          ? 'Stow the handset to get back to Port Meridian.'
          : 'Close the phone to step back into Port Meridian.',
      feedItems: [],
      introTunnel: null,
      launchNote: 'Field device ready.',
      notifications: [
        {
          id: 'world-phone-notification',
          message: 'Objectives, routes, and settings are ready on the field device.',
          title: 'Field device ready',
          tone: 'info',
        },
      ],
      phoneHomeHint: 'Choose an app or stow the phone and get moving.',
      phoneHomeNotifications: [
        {
          id: 'world-phone-objective-notification',
          actionLabel: 'Open objective',
          appId: 'objective',
          message: 'Objective, map, progress, and settings are one tap away.',
          title: 'Field device ready',
        },
      ],
      phoneHomeTitle: 'Port Meridian OS',
      phoneHardwareFrameSrc: getAssetUrl(
        '/city-v2/tiled/device-shell-art/Pixelized_Phone_2/Pixelized_Phone_2/Model_02/Black/front.png'
      ),
      phoneApps,
      phoneDecorativeShortcuts: [],
      phoneMode: 'hub',
      phoneObjectiveState,
      phoneWorldState,
      signalFeedReady: false,
      shellFamilyId: 'phone',
      subtitle: 'Port Meridian Phone // Field ready',
      title: 'Port Meridian Phone',
    };
  }

  activatePhoneApp(appId) {
    return BasePhoneShellController.prototype.activatePhoneApp.call(this, appId);
  }

  returnToPhoneHome() {
    return BasePhoneShellController.prototype.returnToPhoneHome.call(this);
  }

  runPhoneAction(action) {
    if (action?.type === 'set-waypoint') {
      const nextPointId =
        typeof action?.waypoint?.pointId === 'string' && action.waypoint.pointId.trim()
          ? action.waypoint.pointId.trim()
          : null;

      this.setSnapshot((previousSnapshot) => ({
        ...previousSnapshot,
        activeWaypointId: nextPointId,
        phoneWorldState: previousSnapshot.phoneWorldState
          ? {
              ...previousSnapshot.phoneWorldState,
              activeWaypointId: nextPointId,
            }
          : previousSnapshot.phoneWorldState,
      }));
    }

    return BasePhoneShellController.prototype.runPhoneAction.call(this, action);
  }
}

export default WorldPhoneShellController;
