import { PANEL_TYPES } from '../ui/layout/panelTypes';
import { TD_JACK_IN_CALLOUT_SEEN_KEY } from './onboardingStorageKeys';

const HOMEPAGE_NON_CODE_TOWERS = ['BURSTTURRET', 'BLASTTURRET'];

const isFunctionTowerSelected = (selectedTower) =>
  normalizeTowerType(selectedTower?.type || selectedTower?.towerType) === 'FUNCTION';

const getTowerTutorialSelector = (towerType) => {
  switch (towerType) {
    case 'OBJECT':
      return "[data-tutorial='tower-object']";
    case 'VARIABLE':
      return "[data-tutorial='tower-variable']";
    case 'BURSTTURRET':
      return "[data-tutorial='tower-burst-turret']";
    case 'BLASTTURRET':
      return "[data-tutorial='tower-blast-turret']";
    case 'LOG':
      return "[data-tutorial='tower-log']";
    case 'FUNCTION':
    default:
      return "[data-tutorial='tower-function']";
  }
};

const normalizeTowerType = (towerType) =>
  String(towerType || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const getPlacedTowerTypes = (gameState) =>
  Array.isArray(gameState?.towers)
    ? gameState.towers.map((tower) => normalizeTowerType(tower?.type || tower?.towerType))
    : [];

const hasPlacedHomepageNonCodeTower = (gameState) =>
  getPlacedTowerTypes(gameState).some((towerType) => HOMEPAGE_NON_CODE_TOWERS.includes(towerType));

const normalizeLanguageKey = (language) => {
  const normalizedLanguage = String(language || '')
    .trim()
    .toLowerCase();

  if (normalizedLanguage === 'py' || normalizedLanguage === 'python3') return 'python';
  if (
    normalizedLanguage === 'js' ||
    normalizedLanguage === 'node' ||
    normalizedLanguage === 'nodejs'
  ) {
    return 'javascript';
  }
  if (normalizedLanguage === 'c++') return 'cpp';

  return normalizedLanguage || 'python';
};

const normalizeModuleZeroOnboardingId = (onboardingId) => {
  const normalizedOnboardingId = String(onboardingId || '').trim();

  if (normalizedOnboardingId === 'lp-m0-hello-brief') return 'lp-m0-onboarding';
  if (normalizedOnboardingId === 'lp-m0-addition-brief') return 'lp-m0-addition';
  if (normalizedOnboardingId === 'lp-m0-variables-brief') return 'lp-m0-variables';

  return normalizedOnboardingId;
};

const getModuleZeroAnswer = (onboardingId, language) => {
  const normalizedOnboardingId = normalizeModuleZeroOnboardingId(onboardingId);
  const normalizedLanguage = normalizeLanguageKey(language);

  const languageAnswers = {
    'lp-m0-onboarding': {
      python: 'print("Hello, CodeGrind!")',
      javascript: 'console.log("Hello, CodeGrind!");',
      java: 'System.out.println("Hello, CodeGrind!");',
      cpp: 'cout << "Hello, CodeGrind!";',
    },
    'lp-m0-addition': {
      python: 'print(2 + 3)',
      javascript: 'console.log(2 + 3);',
      java: 'System.out.println(2 + 3);',
      cpp: 'cout << (2 + 3);',
    },
    'lp-m0-variables': {
      python: 'name = "CodeGrind"\nprint(name)',
      javascript: 'const name = "CodeGrind";\nconsole.log(name);',
      java: 'String name = "CodeGrind";\nSystem.out.println(name);',
      cpp: 'string name = "CodeGrind";\ncout << name;',
    },
  };

  const missionAnswers = languageAnswers[normalizedOnboardingId];
  if (!missionAnswers) return 'print("Hello, CodeGrind!")';

  return missionAnswers[normalizedLanguage] || missionAnswers.python;
};

const checkModuleZeroCode = ({ onboardingId, language, code }) => {
  const normalizedOnboardingId = normalizeModuleZeroOnboardingId(onboardingId);
  const normalizedLanguage = normalizeLanguageKey(language);
  const normalizedCode = String(code || '');

  const checksByMission = {
    'lp-m0-onboarding': {
      python: /print\s*\(\s*["']Hello,\s*CodeGrind!["']\s*\)/,
      javascript: /console\s*\.\s*log\s*\(\s*["']Hello,\s*CodeGrind!["']\s*\)\s*;?/,
      java: /System\s*\.\s*out\s*\.\s*println\s*\(\s*["']Hello,\s*CodeGrind!["']\s*\)\s*;/,
      cpp: /(?:std\s*::\s*)?cout\s*<<\s*["']Hello,\s*CodeGrind!["']\s*;?/,
    },
    'lp-m0-addition': {
      python: /print\s*\(\s*2\s*\+\s*3\s*\)/,
      javascript: /console\s*\.\s*log\s*\(\s*2\s*\+\s*3\s*\)\s*;?/,
      java: /System\s*\.\s*out\s*\.\s*println\s*\(\s*2\s*\+\s*3\s*\)\s*;/,
      cpp: /(?:std\s*::\s*)?cout\s*<<\s*\(?\s*2\s*\+\s*3\s*\)?\s*;?/,
    },
    'lp-m0-variables': {
      python: {
        hasAssignment: /name\s*=\s*["']CodeGrind["']/,
        hasOutput: /print\s*\(\s*name\s*\)/,
      },
      javascript: {
        hasAssignment: /(?:const|let|var)\s+name\s*=\s*["']CodeGrind["']\s*;?/,
        hasOutput: /console\s*\.\s*log\s*\(\s*name\s*\)\s*;?/,
      },
      java: {
        hasAssignment: /String\s+name\s*=\s*["']CodeGrind["']\s*;/,
        hasOutput: /System\s*\.\s*out\s*\.\s*println\s*\(\s*name\s*\)\s*;/,
      },
      cpp: {
        hasAssignment: /(?:(?:std\s*::\s*)?string)\s+name\s*=\s*["']CodeGrind["']\s*;?/,
        hasOutput: /(?:std\s*::\s*)?cout\s*<<\s*name\s*;?/,
      },
    },
  };

  const missionChecks = checksByMission[normalizedOnboardingId];
  if (!missionChecks) return true;

  const selectedCheck = missionChecks[normalizedLanguage] || missionChecks.python;
  if (!selectedCheck) return true;

  if (selectedCheck instanceof RegExp) {
    return selectedCheck.test(normalizedCode);
  }

  return Boolean(
    selectedCheck.hasAssignment?.test(normalizedCode) &&
    selectedCheck.hasOutput?.test(normalizedCode)
  );
};

const ONBOARDING_CONFIGS = {
  'lp-m0-onboarding': {
    answer: 'print("Hello, CodeGrind!")',
    codeCheck: (code) =>
      code.includes('print("Hello, CodeGrind!")') || code.includes("print('Hello, CodeGrind!')"),
  },
  'lp-m0-addition': {
    answer: 'print(2 + 3)',
    codeCheck: (code) => code.includes('print(2 + 3)') || code.includes('print(2+3)'),
  },
  'lp-m0-variables': {
    answer: 'name = "CodeGrind"\nprint(name)',
    codeCheck: (code) => {
      const hasVar = code.includes('name = "CodeGrind"') || code.includes("name = 'CodeGrind'");
      const hasPrint = code.includes('print(name)');
      return hasVar && hasPrint;
    },
  },
  'lp-m0-hello-brief': {
    answer: 'print("Hello, CodeGrind!")',
    codeCheck: () => true,
  },
  'lp-m0-addition-brief': {
    answer: 'print(2 + 3)',
    codeCheck: () => true,
  },
  'lp-m0-variables-brief': {
    answer: 'name = "CodeGrind"\nprint(name)',
    codeCheck: () => true,
  },
};

const DEFAULT_CONFIG = ONBOARDING_CONFIGS['lp-m0-onboarding'];

const isModuleZeroOnboarding = (onboardingId) =>
  typeof onboardingId === 'string' && onboardingId.startsWith('lp-m0-');

const isModuleZeroBriefOnboarding = (onboardingId) =>
  typeof onboardingId === 'string' &&
  onboardingId.startsWith('lp-m0-') &&
  onboardingId.endsWith('-brief');

const getOnboardingConfig = ({ onboardingId, language }) => {
  const fallbackConfig = ONBOARDING_CONFIGS[onboardingId] || DEFAULT_CONFIG;

  if (!isModuleZeroOnboarding(onboardingId)) {
    return fallbackConfig;
  }

  return {
    ...fallbackConfig,
    answer: getModuleZeroAnswer(onboardingId, language),
    codeCheck: (code, activeLanguage) =>
      checkModuleZeroCode({
        onboardingId,
        language: activeLanguage || language,
        code,
      }),
  };
};

const hasSeenJackInCallout = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(TD_JACK_IN_CALLOUT_SEEN_KEY) === '1';
  } catch {
    return false;
  }
};

const getBeginnerAnswer = (config, conceptIntro) => {
  if (conceptIntro?.example) {
    return conceptIntro.example;
  }

  return config?.answer || 'Type the target code from the mission brief.';
};

export function getHomepageDemoOnboardingScript(language = 'python') {
  const config = getOnboardingConfig({ onboardingId: 'lp-m0-onboarding', language });

  return {
    version: 'v5-homepage-demo',
    config,
    steps: [
      {
        id: 'mission-objective',
        kind: 'callout',
        title: 'READ THE MISSION BRIEF',
        message:
          'Read the full problem here first. This brief tells you exactly what code you must write to win the level.',
        subtext: 'Do not skip this. When the button unlocks, continue to start the breach.',
        targetSelector: "[data-tutorial='problem-panel-header']",
        placement: 'bottom',
        panelFocus: { rightPanel: PANEL_TYPES.PROBLEM },
        requireManualContinue: true,
        requireScrollProgress: 0.35,
        manualContinueDelayMs: 5200,
        manualContinueDelayMobileMs: 6200,
        lockedActionLabel: 'READING BRIEF...',
        blockedActionLabel: 'SCROLL THE BRIEF',
        actionLabel: 'I READ THE BRIEF',
        preserveFocusReadability: true,
        preferMobileTicker: true,
      },
      {
        id: 'jack-in',
        kind: 'callout',
        title: 'CLICK JACK IN',
        message:
          'Click JACK IN now. This starts the breach and unlocks the core setup steps. NOTE: you may need to expand the game panel first to see the button.',
        targetSelector: "[data-tutorial='jack-in-button']",
        placement: 'top',
        calloutGap: 52,
        highlightKey: 'jack-in',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        completeWhen: ({ gameState }) => gameState?.status && gameState.status !== 'prehack',
      },
      {
        id: 'select-function-tower',
        kind: 'callout',
        title: 'CLICK BOILERPLATE CORE',
        message: (context) => {
          if (context?.isMobileSinglePanelLayout) {
            return context.mobileDockExpanded
              ? 'Click the Boilerplate Core inside quick controls to arm it.'
              : 'Tap the TD button to open quick tower controls. (You can also use the Open Loadout button if you prefer)';
          }
          return 'Click the Boilerplate Core to arm it for placement.';
        },
        targetSelector: (context) => {
          if (context?.isMobileSinglePanelLayout) {
            return context.mobileDockExpanded
              ? "[data-tutorial='tower-function']"
              : "[data-tutorial='mobile-td-toggle']";
          }
          return "[data-tutorial='tower-function']";
        },
        placement: 'bottom',
        highlightKey: 'place-towers',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        completeWhen: ({ selectedTowerType, functionTowerPlaced }) =>
          (selectedTowerType && String(selectedTowerType).toUpperCase() === 'FUNCTION') ||
          Boolean(functionTowerPlaced),
      },
      {
        id: 'place-function-tower',
        kind: 'callout',
        title: 'PLACE HERE',
        message: 'Place the Boilerplate Core on one of the green highlighted grid tiles now.',
        subtext: 'The highlighted spaces are the valid placement spots.',
        targetSelector: "[data-tutorial='game-grid']",
        placement: 'right',
        highlightKey: 'place-towers',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: ({ functionTowerPlaced }) => Boolean(functionTowerPlaced),
        showWhen: ({ selectedTowerType, functionTowerPlaced }) =>
          selectedTowerType &&
          String(selectedTowerType).toUpperCase() === 'FUNCTION' &&
          !functionTowerPlaced,
        completeWhen: ({ functionTowerPlaced, functionTowerLaserCompleted, surfaceVariant }) => {
          if (surfaceVariant !== 'homepage') {
            return Boolean(functionTowerPlaced);
          }
          return Boolean(functionTowerPlaced) && Boolean(functionTowerLaserCompleted);
        },
      },
      {
        id: 'towers-make-code',
        kind: 'callout',
        title: 'YOUR TOWERS MAKE CODE',
        message: 'Towers place code directly into your editor.',
        placement: 'center',
        panelFocus: { leftPanel: PANEL_TYPES.GAME, rightPanel: PANEL_TYPES.EDITOR },
        requireManualContinue: true,
        preserveFocusReadability: true,
        showWhen: ({ functionTowerPlaced }) => Boolean(functionTowerPlaced),
        completeWhen: (_, manualCompletedSteps) =>
          Boolean(manualCompletedSteps['towers-make-code']),
      },
      {
        id: 'inspect-function-tower',
        kind: 'callout',
        title: 'TAP THE BOILERPLATE CORE',
        message: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Give the placed Boilerplate Core a tap once for range ring, then tap the same tower again to open the upgrade menu.'
            : 'Click the placed Boilerplate Core to inspect its range and details.',
        subtext: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Tap once, then tap the same tower again on the phone layout.'
            : 'Click once for the range ring and upgrade menu.',
        targetSelector: "[data-tutorial='game-grid']",
        placement: 'right',
        highlightKey: 'inspect-tower',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preferMobileTicker: true,
        showWhen: ({ functionTowerPlaced, codeSubmitted }, manualCompletedSteps) =>
          Boolean(functionTowerPlaced) &&
          !codeSubmitted &&
          Boolean(manualCompletedSteps['towers-make-code']),
        completeWhen: ({
          isMobileSinglePanelLayout,
          selectedTower,
          towerInspectionRangeShown,
          towerInspectionDetailsOpened,
          towerInspectionAdvanceReady,
        }) => {
          const type = String(selectedTower?.type || selectedTower?.towerType || '').toUpperCase();
          if (type !== 'FUNCTION' || !towerInspectionRangeShown) return false;
          if (isMobileSinglePanelLayout) {
            return Boolean(towerInspectionDetailsOpened && towerInspectionAdvanceReady);
          }
          return Boolean(towerInspectionAdvanceReady);
        },
      },
      {
        id: 'explore-tower-upgrade',
        kind: 'callout',
        title: 'LEARN YOUR TOWER',
        message: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Your Boilerplate Core details are open! Swipe to browse upgrades, stats, and targeting options that make your tower stronger.'
            : 'Your Boilerplate Core is selected. The upgrade panel shows stats, module upgrades, and targeting — all the tools to enhance your tower.',
        subtext: 'Upgrade modules to boost damage and unlock special abilities.',
        targetSelector: "[data-tutorial='tower-upgrade-panel']",
        placement: 'right',
        highlightKey: 'upgrade-panel',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preferMobileTicker: true,
        showWhen: ({ selectedTower }) => {
          if (!selectedTower) return false;
          const type = String(selectedTower.type || selectedTower.towerType || '').toUpperCase();
          return type === 'FUNCTION';
        },
        completeWhen: (_, manualCompletedSteps) =>
          Boolean(manualCompletedSteps['explore-tower-upgrade']),
        actionLabel: 'I SEE IT',
        autoAdvanceAfter: 5000,
        autoAdvanceAfterMobile: 7000,
      },
      {
        id: 'write-code',
        kind: 'callout',
        title: 'TYPE THIS',
        message: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Replace pass in the phone editor with this exact code to solve the mission brief.'
            : 'Type this exact code in the editor to solve the mission brief. You can also press Tab to accept the ghost text.',
        subtext: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Phone editor mode does not support ghost text. Delete pass and type the answer shown below.'
            : 'Follow the mission brief and match the answer shown below.',
        targetSelector: "[data-tutorial='code-editor']",
        placement: ({ isMobileSinglePanelLayout }) => (isMobileSinglePanelLayout ? 'top' : 'left'),
        highlightKey: 'write-code',
        answerLabel: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout ? 'TYPE THIS ANSWER' : 'TYPE THIS UNDER TODO COMMENT',
        answerCode: () => config.answer,
        panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
        preferMobileTicker: true,
        showWhen: ({ initialCodeGenerated }) => Boolean(initialCodeGenerated),
        completeWhen: ({ editorCode, language: contextLanguage }) =>
          Boolean(config.codeCheck(editorCode || '', contextLanguage || language)),
      },
      {
        id: 'press-enter',
        kind: 'callout',
        title: 'EXECUTE YOUR CODE',
        message:
          'Press Enter after the print statement to commit your code. This sends your line to the terminal for processing.',
        subtext: 'The terminal will analyze your code and suggest a tower to deploy.',
        targetSelector: "[data-tutorial='code-editor']",
        placement: 'left',
        highlightKey: 'write-code',
        panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
        preserveFocusReadability: true,
        preferMobileTicker: true,
        showWhen: (
          { initialCodeGenerated, logTowerLaserCompleted, gameState },
          manualCompletedSteps
        ) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return (
            Boolean(initialCodeGenerated) &&
            !placedTypes.includes('LOG') &&
            !logTowerLaserCompleted &&
            Boolean(manualCompletedSteps['write-code'])
          );
        },
        completeWhen: () => {
          if (typeof window !== 'undefined' && window.__tdCodeLineCommitted) {
            return true;
          }
          return false;
        },
      },
      {
        id: 'respond-in-terminal',
        kind: 'callout',
        title: 'CHECK THE TERMINAL',
        message:
          'The terminal is asking if you want to buy a Log tower! Type yes in the terminal input and press Enter to confirm.',
        subtext:
          'The terminal input is below the terminal output area. Click it, type yes, and press Enter to deploy your Log module.',
        targetSelector: "[data-learning='terminal-input']",
        placement: 'bottom',
        highlightKey: 'place-towers',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        preferMobileTicker: true,
        showWhen: (
          { initialCodeGenerated, logTowerLaserCompleted, terminalResponseSubmitted, gameState },
          manualCompletedSteps
        ) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return (
            Boolean(initialCodeGenerated) &&
            Boolean(manualCompletedSteps['press-enter']) &&
            !terminalResponseSubmitted
          );
        },
        completeWhen: ({ terminalResponseSubmitted }) => {
          return Boolean(terminalResponseSubmitted);
        },
      },
      {
        id: 'place-log-tower',
        kind: 'callout',
        title: 'PLACE THE LOG TOWER',
        message: 'Now place the Log tower on one of the green highlighted tile.',
        subtext:
          'Choose the Log tower in the tower bar, then click any highlighted grid square to place it.',
        targetSelector: "[data-tutorial='game-grid']",
        placement: 'top',
        highlightKey: 'place-towers',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        showWhen: ({ gameState, logTowerLaserCompleted }, manualCompletedSteps) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return (
            Boolean(manualCompletedSteps['respond-in-terminal']) &&
            !placedTypes.includes('LOG') &&
            !logTowerLaserCompleted
          );
        },
        completeWhen: ({ gameState, logTowerLaserCompleted }) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return placedTypes.includes('LOG') || Boolean(logTowerLaserCompleted);
        },
      },
      {
        id: 'code-makes-towers',
        kind: 'callout',
        title: 'YOUR CODE GENERATES TOWER SUGGESTIONS',
        message: 'Writing code will suggest towers to buy',
        placement: 'center',
        panelFocus: { leftPanel: PANEL_TYPES.GAME, rightPanel: PANEL_TYPES.EDITOR },
        requireManualContinue: true,
        preserveFocusReadability: true,
        showWhen: ({ gameState, logTowerLaserCompleted }, manualCompletedSteps) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return (
            (placedTypes.includes('LOG') || Boolean(logTowerLaserCompleted)) &&
            Boolean(manualCompletedSteps['place-log-tower'])
          );
        },
        completeWhen: (_, manualCompletedSteps) =>
          Boolean(manualCompletedSteps['code-makes-towers']),
      },
      {
        id: 'start-wave',
        kind: 'callout',
        title: 'CLICK START WAVE',
        message: 'Click START WAVE now to run the first wave.',
        targetSelector: "[data-tutorial='game-start-wave-button']",
        placement: 'top',
        calloutGap: 96,
        highlightKey: 'start-wave',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        showWhen: ({ initialCodeGenerated, gameState }, manualCompletedSteps) => {
          const placedTypes = getPlacedTowerTypes(gameState);
          return (
            Boolean(initialCodeGenerated) &&
            placedTypes.includes('LOG') &&
            Boolean(manualCompletedSteps['code-makes-towers'])
          );
        },
        completeWhen: ({ gameState }) => {
          const status = gameState?.status;
          return status === 'playing' || status === 'wave-complete' || (gameState?.wave || 0) > 1;
        },
      },
      {
        id: 'why-code-matters',
        kind: 'transmission',
        title: 'YOUR CODE IS YOUR DEFENSE',
        message:
          'You are solving real coding problems. You do that by playing the game. Build your solution wave by wave — write correct code and your defenses hold strong. Get it wrong and enemies break through.\n\nCodeGrind turns coding practice and interview prep into a game. The tower defense makes it fun, but the coding is what counts.',
        targetSelector: "[data-tutorial='homepage-demo-root']",
        placement: 'top',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        showWhen: ({ gameState, lifeLossCount }) => {
          const status = gameState?.status;
          return status === 'playing' && (gameState?.wave || 0) <= 1 && !((lifeLossCount || 0) > 0);
        },
        autoAdvanceAfter: 7000,
        autoAdvanceAfterMobile: 9000,
      },
      {
        id: 'life-loss-warning',
        kind: 'callout',
        title: 'LIVES ARE LIMITED',
        message:
          'Be careful. You only have a limited number of lives, and once they are gone you cannot regain them.',
        targetSelector: "[data-tutorial='lives-display']",
        placement: 'bottom',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        showWhen: ({ lifeLossCount, gameState }) =>
          (lifeLossCount || 0) > 0 && gameState?.status !== 'prehack',
        autoAdvanceAfter: 5400,
        autoAdvanceAfterMobile: 7600,
        optional: true,
      },
      {
        id: 'interwave-slot-switch-intro',
        kind: 'callout',
        title: 'SWITCH WHAT YOU SEE',
        message:
          "Now it's time to show you how to switch what is on the screen. The taskbar below lets you choose which surfaces appear on the left and right sides of the desktop.",
        subtext: 'Press Continue when you are ready to try it.',
        targetSelector: "[data-tutorial='slot-switch-taskbar']",
        placement: 'bottom',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        requireManualContinue: true,
        actionLabel: 'CONTINUE',
        showWhen: ({ gameState, codeSubmitted }) =>
          gameState?.status === 'wave-complete' && !codeSubmitted && (gameState?.wave || 0) >= 2,
      },
      {
        id: 'interwave-slot-switch-side',
        kind: 'callout',
        title: 'CLICK L OR R',
        message: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Tap the L or R badge on the taskbar to select which side of the desktop you want to swap.'
            : 'Click the L or R badge on the taskbar to select which side of the desktop you want to swap.',
        subtext: 'After clicking L or R, you will pick a window to assign to that side.',
        targetSelector: "[data-tutorial='slot-side-badges']",
        placement: 'bottom',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        showWhen: ({ gameState, codeSubmitted }) =>
          gameState?.status === 'wave-complete' && !codeSubmitted && (gameState?.wave || 0) >= 2,
        completeWhen: ({ slotSwitchSideClicked }) => Boolean(slotSwitchSideClicked),
      },
      {
        id: 'interwave-slot-switch-assign',
        kind: 'callout',
        title: 'CLICK A WINDOW',
        message: ({ isMobileSinglePanelLayout }) =>
          isMobileSinglePanelLayout
            ? 'Now tap one of the unselected window buttons (like Chat or Problem) to load that surface into the selected side.'
            : 'Now click one of the unselected window chips (like Chat or Problem) to load that surface into the selected side.',
        subtext: 'The tutorial will wait until the slot actually swaps before moving on.',
        targetSelector: () => {
          if (typeof document === 'undefined') return "[data-tutorial-role='panel-switcher']";

          // 1. Grab all the available panel switcher chip elements
          const chips = Array.from(
            document.querySelectorAll("[data-tutorial-role='panel-switcher']")
          );

          // 2. Filter for chips that DO NOT contain an active side badge (the blue LEFT or RIGHT buttons)
          const unselectedChips = chips.filter((chip) => {
            // Adjust this text or class check to match whatever renders your blue 'LEFT'/'RIGHT' badges
            const hasActiveBadge = Array.from(chip.querySelectorAll('*')).some((el) => {
              const txt = (el.textContent || '').trim().toUpperCase();
              return txt === 'LEFT' || txt === 'RIGHT';
            });
            return !hasActiveBadge;
          });

          // 3. Fallback safely if DOM elements aren't parsed yet; otherwise target the unselected ones
          if (unselectedChips.length === 0) {
            return "[data-tutorial-role='panel-switcher']";
          }

          // Return a unique identifier or apply a temporary attribute so the overlay system highlights them
          unselectedChips.forEach((chip) =>
            chip.setAttribute('data-tutorial-unselected-chip', 'true')
          );
          return "[data-tutorial-unselected-chip='true']";
        },
        placement: 'bottom',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preserveFocusReadability: true,
        showWhen: ({ gameState, codeSubmitted }) =>
          gameState?.status === 'wave-complete' && !codeSubmitted && (gameState?.wave || 0) >= 2,
        completeWhen: ({ slotSwitchLayoutChanged, slotSwitchAdvanceReady }) =>
          Boolean(slotSwitchLayoutChanged && slotSwitchAdvanceReady),
      },
      {
        id: 'interwave-tools',
        kind: 'callout',
        title: 'CLICK A UTILITY BLOCK',
        message: (context) => {
          if (context?.isMobileSinglePanelLayout) {
            return context.mobileDockExpanded
              ? 'Click a BurstTurret or BlastTurret now.'
              : 'Tap the TD button to open quick tower controls. (You can also use the Open Loadout button if you prefer)';
          }
          return 'Click a BurstTurret or BlastTurret now. These blocks add raw defense without changing your code.';
        },
        targetSelector: (context) => {
          if (context?.isMobileSinglePanelLayout) {
            return context.mobileDockExpanded
              ? getTowerTutorialSelector('BURSTTURRET')
              : "[data-tutorial='mobile-td-toggle']";
          }
          return getTowerTutorialSelector('BURSTTURRET');
        },
        placement: 'left',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preferMobileTicker: true,
        showWhen: ({ gameState, codeSubmitted }, manualCompletedSteps) =>
          Boolean(manualCompletedSteps['interwave-slot-switch-assign']) &&
          gameState?.status === 'wave-complete' &&
          !codeSubmitted &&
          (gameState?.wave || 0) >= 2,
        completeWhen: ({ selectedTowerType, gameState }) =>
          HOMEPAGE_NON_CODE_TOWERS.includes(normalizeTowerType(selectedTowerType)) ||
          hasPlacedHomepageNonCodeTower(gameState),
      },
      {
        id: 'interwave-place-non-code',
        kind: 'callout',
        title: 'PLACE IT HERE',
        message: 'Place the utility block on a highlighted grid tile now.',
        subtext: 'Click a highlighted placement spot to continue.',
        targetSelector: "[data-tutorial='game-grid']",
        placement: 'right',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preferMobileTicker: true,
        showWhen: ({ gameState, codeSubmitted, selectedTowerType }, manualCompletedSteps) =>
          (Boolean(manualCompletedSteps['interwave-tools']) ||
            HOMEPAGE_NON_CODE_TOWERS.includes(normalizeTowerType(selectedTowerType))) &&
          gameState?.status === 'wave-complete' &&
          !codeSubmitted &&
          !hasPlacedHomepageNonCodeTower(gameState) &&
          (gameState?.wave || 0) >= 2,
        completeWhen: ({ gameState }) => hasPlacedHomepageNonCodeTower(gameState),
      },
      {
        id: 'final-wave-lock',
        kind: 'transmission',
        title: 'FINAL WAVE RULE',
        message:
          'VERIFY locks in your code. Correct code gives you a winnable final wave. Wrong code sends the run into endless mode, which is still a loss.',
        targetSelector: "[data-tutorial='homepage-demo-root']",
        placement: 'top',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        showWhen: ({ gameState, codeSubmitted }, manualCompletedSteps) =>
          Boolean(manualCompletedSteps['interwave-place-non-code']) &&
          gameState?.status === 'wave-complete' &&
          !codeSubmitted &&
          (gameState?.wave || 0) >= 2,
        autoAdvanceAfter: 6400,
        autoAdvanceAfterMobile: 9000,
      },
      {
        id: 'verify-solution',
        kind: 'callout',
        title: 'CLICK VERIFY',
        message:
          'Click VERIFY now. If your code is right, you get the final wave and can win. If your code is wrong, the run goes endless and the level is lost.',
        subtext: 'If you followed the steps and typed the exact answer, you should win.',
        targetSelector: "[data-tutorial='verify-button']",
        placement: 'top',
        calloutGap: 132,
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        preferMobileTicker: true,
        showWhen: ({ gameState, codeSubmitted }, manualCompletedSteps) => {
          const status = gameState?.status;
          return (
            Boolean(manualCompletedSteps['final-wave-lock']) &&
            Boolean((gameState?.wave || 0) >= 2) &&
            !codeSubmitted &&
            (status === 'ready' || status === 'wave-complete')
          );
        },
        completeWhen: ({ codeSubmitted, verifyAttemptInProgress }) =>
          Boolean(codeSubmitted || verifyAttemptInProgress),
      },
    ],
  };
}

const hasSeenUniverseRules = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('guest_universe_rules_acknowledged_v1') === 'true';
  } catch {
    return false;
  }
};

export function getLearningPathOnboardingScript({
  onboardingId,
  conceptIntro,
  language = 'python',
  surfaceVariant = 'learning',
}) {
  const config = getOnboardingConfig({ onboardingId, language });
  const isHomepageSurface = surfaceVariant === 'homepage';
  const isModuleZero = isModuleZeroOnboarding(onboardingId);
  const isModuleZeroBrief = isModuleZeroBriefOnboarding(onboardingId);

  if (!isHomepageSurface && isModuleZeroBrief) {
    if (!conceptIntro) {
      return {
        version: 'v6-m0-brief-empty',
        config,
        steps: [],
      };
    }

    const m0BriefSteps = [
      {
        id: 'concept-intro',
        kind: 'concept-card',
        title: conceptIntro.title,
        message: conceptIntro.description || null,
        icon: conceptIntro.icon,
        bullets: conceptIntro.bullets,
        example: conceptIntro.example,
        exampleOutput: conceptIntro.exampleOutput,
        answerLabel: 'TYPE THIS ANSWER',
        answerCode: getBeginnerAnswer(config, conceptIntro),
        missionReasonTitle: 'BEGINNER NOTE',
        missionReasonBody:
          'You already completed the baseline breach tutorial. This mission only highlights the new concept and expected syntax.',
        actionLabel: "Got it, let's code!",
        completeWhen: (_, manualCompletedSteps) => Boolean(manualCompletedSteps['concept-intro']),
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
      },
    ];

    if (!hasSeenUniverseRules()) {
      m0BriefSteps.unshift({
        id: 'universe-rules',
        kind: 'universe-rules',
      });
    }

    return {
      version: 'v6-m0-brief-concept-only',
      config,
      steps: m0BriefSteps,
    };
  }

  const steps = [
    {
      id: 'jack-in',
      kind: 'callout',
      title: 'JACK IN',
      message: 'Press JACK IN to begin the breach.',
      targetSelector: "[data-tutorial='jack-in-button']",
      placement: 'bottom',
      highlightKey: 'jack-in',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      showWhen: () => !hasSeenJackInCallout(),
      completeWhen: ({ gameState }) => gameState?.status && gameState.status !== 'prehack',
    },
    {
      id: 'select-function-tower',
      kind: 'callout',
      title: 'BOILERPLATE CORE',
      message: (context) => {
        if (context?.isMobileSinglePanelLayout) {
          return context.mobileDockExpanded
            ? 'Press the Boilerplate Core inside quick controls to arm it.'
            : 'Tap the TD button to open quick tower controls. (You can also use the Open Loadout button if you prefer)';
        }
        return 'Press the Boilerplate Core to arm it.';
      },
      targetSelector: (context) => {
        if (context?.isMobileSinglePanelLayout) {
          return context.mobileDockExpanded
            ? getTowerTutorialSelector('FUNCTION')
            : "[data-tutorial='mobile-td-toggle']";
        }
        return getTowerTutorialSelector('FUNCTION');
      },
      placement: 'bottom',
      highlightKey: 'place-towers',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      showWhen: ({ gameState }) => gameState?.status && gameState.status !== 'prehack',
      completeWhen: ({ selectedTowerType, functionTowerPlaced }) =>
        (selectedTowerType && String(selectedTowerType).toUpperCase() === 'FUNCTION') ||
        Boolean(functionTowerPlaced),
    },
    {
      id: 'place-function-tower',
      kind: 'callout',
      title: 'PLACE ON GRID',
      message: 'Place tower on the grid.',
      targetSelector: "[data-tutorial='game-grid']",
      placement: 'right',
      highlightKey: 'place-towers',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      showWhen: ({ selectedTowerType, functionTowerPlaced }) =>
        selectedTowerType &&
        String(selectedTowerType).toUpperCase() === 'FUNCTION' &&
        !functionTowerPlaced,
      completeWhen: ({ functionTowerPlaced, functionTowerLaserCompleted, surfaceVariant }) => {
        if (surfaceVariant !== 'homepage') {
          return Boolean(functionTowerPlaced);
        }
        return Boolean(functionTowerPlaced) && Boolean(functionTowerLaserCompleted);
      },
    },
  ];

  if (!isHomepageSurface && !isModuleZero) {
    return {
      version: 'v5-learning-no-modal',
      config,
      steps: [],
    };
  }

  if (isModuleZero && conceptIntro) {
    steps.push({
      id: 'concept-intro',
      kind: 'concept-card',
      title: conceptIntro.title,
      message: conceptIntro.description || null,
      icon: conceptIntro.icon,
      bullets: conceptIntro.bullets,
      example: conceptIntro.example,
      exampleOutput: conceptIntro.exampleOutput,
      answerLabel: 'TYPE THIS ANSWER',
      answerCode: getBeginnerAnswer(config, conceptIntro),
      missionReasonTitle: 'BEGINNER NOTE',
      missionReasonBody:
        'These first missions include direct answer scaffolding so you can learn the concept quickly and progress. Upcoming missions gradually remove this guidance.',
      actionLabel: "Got it, let's code!",
      showWhen: ({ initialCodeGenerated }) => Boolean(initialCodeGenerated),
      completeWhen: (_, manualCompletedSteps) => Boolean(manualCompletedSteps['concept-intro']),
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
    });
  }

  steps.push(
    {
      id: 'write-code',
      kind: 'callout',
      title: 'WRITE CODE',
      message: ({ isMobileSinglePanelLayout }) =>
        isMobileSinglePanelLayout
          ? 'Type this exact answer in the phone editor to continue.'
          : 'Type the code shown in the editor or press Tab to accept the ghost text.',
      subtext: ({ isMobileSinglePanelLayout }) =>
        isMobileSinglePanelLayout
          ? 'Phone editor mode does not support ghost text. Match the answer shown below.'
          : 'Ghost-text hints are only available in intro missions.',
      targetSelector: "[data-tutorial='code-editor']",
      placement: ({ isMobileSinglePanelLayout }) => (isMobileSinglePanelLayout ? 'top' : 'left'),
      highlightKey: 'write-code',
      answerLabel: ({ isMobileSinglePanelLayout }) =>
        isMobileSinglePanelLayout ? 'TYPE THIS ANSWER' : 'TYPE THIS UNDER TODO COMMENT',
      answerCode: () => config.answer,
      panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
      showWhen: ({ initialCodeGenerated }, manualCompletedSteps) =>
        Boolean(initialCodeGenerated) &&
        (!conceptIntro || Boolean(manualCompletedSteps['concept-intro'])),
      completeWhen: ({ editorCode, language: contextLanguage }) =>
        Boolean(config.codeCheck(editorCode || '', contextLanguage || language)),
    },
    {
      id: 'start-wave',
      kind: 'callout',
      title: 'START WAVE',
      message: 'Launch the first wave when your setup is ready.',
      targetSelector: "[data-tutorial='game-start-wave-button']",
      placement: 'top',
      calloutGap: 96,
      highlightKey: 'start-wave',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      showWhen: ({ initialCodeGenerated, editorCode }, manualCompletedSteps) =>
        Boolean(initialCodeGenerated) &&
        (!conceptIntro || Boolean(manualCompletedSteps['concept-intro'])) &&
        Boolean(config.codeCheck(editorCode || '', language)),
      completeWhen: ({ gameState }) => {
        const status = gameState?.status;
        return status === 'playing' || status === 'wave-complete' || (gameState?.wave || 0) > 1;
      },
    }
  );

  if (!isHomepageSurface && !hasSeenUniverseRules()) {
    steps.unshift({
      id: 'universe-rules',
      kind: 'universe-rules',
    });
  }

  return {
    version: 'v4',
    config,
    steps,
  };
}

export function getProTrialOnboardingScript() {
  const steps = [
    {
      id: 'pro-briefing',
      kind: 'transmission',
      title: 'PRO TRACK ORIENTATION',
      message: 'Fast brief only. This track assumes confident operators and minimal guidance.',
      targetSelector: "[data-tutorial='game-grid']",
      placement: 'top',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      autoAdvanceAfter: 4200,
    },
    {
      id: 'pro-full-arsenal',
      kind: 'callout',
      title: 'FULL ARSENAL ONLINE',
      message:
        'All tower modules are available from the start on Pro. Use the full set to build your solution immediately.',
      targetSelector: "[data-tutorial='tower-selector']",
      placement: 'bottom',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      autoAdvanceAfter: 5800,
    },
    {
      id: 'pro-language-warning',
      kind: 'callout',
      title: 'LOCK LANGUAGE EARLY',
      message:
        'Choose your language before you commit to a build. Switching language mid-run wipes your current solution progress.',
      targetSelector: "[data-tutorial='code-editor']",
      placement: 'left',
      panelFocus: { rightPanel: PANEL_TYPES.EDITOR },
      autoAdvanceAfter: 6200,
    },
    {
      id: 'pro-codex-reference',
      kind: 'callout',
      title: 'CODEx REFERENCE',
      message:
        'Need a rules refresher later? Open Settings and use Tutorial Controls as your quick-reference codex surface.',
      targetSelector: "[data-tutorial='settings-button']",
      placement: 'bottom',
      panelFocus: { leftPanel: PANEL_TYPES.GAME },
      autoAdvanceAfter: 5600,
    },
  ];

  if (!hasSeenUniverseRules()) {
    steps.unshift({
      id: 'universe-rules',
      kind: 'universe-rules',
    });
  }

  return {
    version: 'v2-pro-trial',
    config: DEFAULT_CONFIG,
    steps,
  };
}
