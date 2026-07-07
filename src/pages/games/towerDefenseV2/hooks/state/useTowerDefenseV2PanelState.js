import { useEffect, useState } from 'react';

export default function useTowerDefenseV2PanelState({
  learningPathOnboarding,
  defaultLeftPanel,
  defaultRightPanel,
}) {
  const [leftPanel, setLeftPanel] = useState(defaultLeftPanel);
  const [rightPanel, setRightPanel] = useState(defaultRightPanel);
  const [learningPathOnboardingActive, setLearningPathOnboardingActive] =
    useState(learningPathOnboarding);

  useEffect(() => {
    // console.log(
    //   `[useTowerDefenseV2PanelState] Panel state changed: left=${leftPanel}, right=${rightPanel}`
    // );
  }, [leftPanel, rightPanel]);

  useEffect(() => {
    setLearningPathOnboardingActive(learningPathOnboarding);
  }, [learningPathOnboarding]);

  return {
    leftPanel,
    rightPanel,
    setLeftPanel,
    setRightPanel,
    learningPathOnboardingActive,
    setLearningPathOnboardingActive,
  };
}
