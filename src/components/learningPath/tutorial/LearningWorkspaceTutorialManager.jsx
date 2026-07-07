import React, { useEffect, useMemo, useRef, useState } from 'react';
import TutorialHighlight from '../../towerDefense/ui/tutorial/TutorialHighlight';
import TutorialPopup from '../../towerDefense/ui/tutorial/TutorialPopup';

const STORAGE_KEY = 'learning_workspace_tutorial_completed';

const buildSteps = ({ includeChat, ensureChatVisible }) => {
  const steps = [
    {
      title: 'Welcome to the Learning Workspace',
      content: `
        <p>This workspace is where you solve learning-path problems.</p>
        <p>We will point out the key panels and controls so you can move fast.</p>
      `,
      targetElement: null,
      placement: 'center',
      canSkip: true
    },
    {
      title: 'Problem Description',
      content: `
        <p>This panel explains the task, inputs, outputs, and examples.</p>
        <p>Use it as your checklist while you code.</p>
      `,
      targetElement: "[data-tutorial='learning-problem-description']",
      placement: 'right',
      canSkip: true
    },
    {
      title: 'Editor Area',
      content: `
        <p>This is your code editor. Edit the starter code to solve the problem.</p>
        <p>We track your changes and run tests against your solution.</p>
      `,
      targetElement: "[data-tutorial='learning-editor-area']",
      placement: 'left',
      canSkip: true
    },
    {
      title: 'Quick Controls',
      content: `
        <p>These quick buttons toggle visuals and the chat panel.</p>
        <ul>
          <li><strong>Eye icon</strong>: turn animations on/off</li>
          <li><strong>Chat icon</strong>: show or hide the assistant</li>
          <li><strong>Reset icon</strong>: reset the tutorial</li>
        </ul>
      `,
      targetElement: "[data-tutorial='learning-editor-quick-controls']",
      placement: 'bottom',
      canSkip: true
    },
    {
      title: 'Editor Header Buttons',
      content: `
        <p>These buttons run and verify your code:</p>
        <ul>
          <li><strong>Run Code</strong>: a quick test. Use this while you build to see if the logic works.</li>
          <li><strong>Stdout</strong>: the normal output from <code>print()</code>. Use prints to trace your logic—pros do this constantly.</li>
          <li><strong>Stderr</strong>: error output (tracebacks). If something breaks, look here first.</li>
          <li><strong>Submit Code</strong>: the final check. Use this when you think you are done and want to move on.</li>
        </ul>
        <p><strong>Pro tip:</strong> Add temporary <code>print()</code> lines to show variable values and control flow. It is one of the fastest ways to debug.</p>
      `,
      targetElement: "[data-tutorial='learning-editor-actions']",
      placement: 'bottom',
      canSkip: true
    },
    {
      title: 'Terminal Output',
      content: `
        <p>Output from your code appears here.</p>
        <p>Use it to confirm your prints or debug errors.</p>
      `,
      targetElement: "[data-tutorial='learning-terminal-area']",
      placement: 'top',
      canSkip: true
    }
  ];

  if (includeChat) {
    steps.push({
      title: 'Chat Assistant',
      content: `
        <p>This panel is your AI helper. Ask for hints or clarification.</p>
        <p>Keep it focused on your current task for the best results.</p>
        <p>The AI assistant already has context about the problem you are solving, the code in your editor and any errors you may see in your terminal output.</p>
        <p>In Learning Mode, you are limited to only getting hints/help from the assistant, no full solutions.</p>
      `,
      targetElement: "[data-tutorial='learning-chat-area']",
      placement: 'left',
      canSkip: true,
      onEnter: () => ensureChatVisible?.()
    });
  }

  steps.push({
    title: 'You are ready',
    content: `
      <p>That is the workspace tour. You can start coding now.</p>
      <p>Good luck — you have got this.</p>
    `,
    targetElement: null,
    placement: 'center',
    canSkip: true
  });

  return steps;
};

const LearningWorkspaceTutorialManager = ({
  children,
  isLearningMode = false,
  isChatVisible = true,
  onEnsureChatVisible,
  storageKey = STORAGE_KEY,
  onSkip,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const popupRef = useRef(null);

  const steps = useMemo(
    () => buildSteps({ includeChat: isChatVisible || Boolean(onEnsureChatVisible), ensureChatVisible: onEnsureChatVisible }),
    [isChatVisible, onEnsureChatVisible]
  );

  const stepsByIndex = useMemo(() => {
    return steps.reduce((acc, step, index) => {
      acc[index + 1] = step;
      return acc;
    }, {});
  }, [steps]);

  useEffect(() => {
    if (!isLearningMode) return;
    try {
      const stored = localStorage.getItem(storageKey);
      const seen = stored === 'true';
      setHasSeenTutorial(seen);
      if (!seen) {
        setIsActive(true);
      }
    } catch {
      setIsActive(true);
    }
  }, [isLearningMode, storageKey]);

  useEffect(() => {
    if (!isLearningMode) return undefined;
    const handleReset = () => {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
      setHasSeenTutorial(false);
      setCurrentStep(1);
      setIsActive(true);
    };
    window.addEventListener('learning-workspace-tutorial-reset', handleReset);
    return () => window.removeEventListener('learning-workspace-tutorial-reset', handleReset);
  }, [isLearningMode, storageKey]);

  useEffect(() => {
    if (!isActive) return;
    const step = stepsByIndex[currentStep];
    step?.onEnter?.();
  }, [currentStep, isActive, stepsByIndex]);

  const markSeen = () => {
    setHasSeenTutorial(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore storage errors
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    markSeen();
    onSkip?.();
  };

  const handleComplete = () => {
    setIsActive(false);
    markSeen();
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep >= steps.length) {
      handleComplete();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (!isLearningMode) return children;

  return (
    <>
      {children}
      {isActive && (
        <TutorialPopup
          ref={popupRef}
          step={currentStep}
          isDemo={false}
          onNextStep={handleNext}
          onPreviousStep={handlePrevious}
          onSkipTutorial={handleSkip}
          onCompleteStep={handleComplete}
          tutorialContent={stepsByIndex}
          totalSteps={steps.length}
          isVisible={isActive}
          targetElement={stepsByIndex[currentStep]?.targetElement}
          placement={stepsByIndex[currentStep]?.placement}
          canSkip={stepsByIndex[currentStep]?.canSkip}
        />
      )}

      {isActive && stepsByIndex[currentStep]?.targetElement && (
        <TutorialHighlight
          key={`learning-workspace-highlight-${currentStep}`}
          targetElement={stepsByIndex[currentStep].targetElement}
          popupElement={popupRef}
          isActive={isActive}
          highlightType="pulse"
          showArrow={true}
          color="#00ff88"
          glowColor="rgba(0, 255, 136, 0.8)"
        />
      )}
    </>
  );
};

export default LearningWorkspaceTutorialManager;
