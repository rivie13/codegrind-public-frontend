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

export function getHomepageDemoOnboardingScript(language = 'python') {
  // Legacy 18-step removed — kept as alias for backwards compat, now returns lite 3-step
  return getHomepageLiteOnboardingScript(language);
}

export function getHomepageLiteOnboardingScript(language = 'python') {
  const config = getOnboardingConfig({ onboardingId: 'lp-m0-onboarding', language: 'python' });
  return {
    version: 'v7-homepage-lite',
    config,
    steps: [
      {
        id: 'lite-brief',
        kind: 'callout',
        title: 'READ THE BRIEF',
        message: 'THIS IS WHERE YOU READ THE MISSION BRIEF. The problem panel shows the coding problem you are solving.',
        targetSelector: "[data-tutorial='problem-panel-header']",
        placement: 'bottom',
        panelFocus: { rightPanel: PANEL_TYPES.PROBLEM },
        requireManualContinue: true,
        actionLabel: 'I READ THE BRIEF',
      },
      {
        id: 'lite-start-wave',
        kind: 'callout',
        title: 'START WAVE',
        message: 'Press Start Wave. The pre-placed tower defends both waves — just watch.',
        targetSelector: "[data-tutorial='game-start-wave-button']",
        placement: 'top',
        highlightKey: 'start-wave',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        completeWhen: ({ gameState }) => {
          const s = gameState?.status;
          return s === 'playing' || s === 'wave-complete' || (gameState?.wave || 0) >= 1;
        },
      },
      {
        id: 'lite-submit',
        kind: 'callout',
        title: 'SUBMIT',
        message: 'Press Submit when ready. Two waves, one code — button only.',
        targetSelector: "[data-tutorial='verify-button']",
        placement: 'top',
        highlightKey: 'start-wave',
        panelFocus: { leftPanel: PANEL_TYPES.GAME },
        showWhen: ({ gameState }) => (gameState?.wave || 0) >= 1,
        completeWhen: ({ codeSubmitted, verifyAttemptInProgress }) => Boolean(codeSubmitted || verifyAttemptInProgress),
      },
    ],
  };
}
