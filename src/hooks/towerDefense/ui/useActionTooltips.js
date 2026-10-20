import { useEffect, useState } from 'react';
import visualSettingsManager from '../../../utils/game/VisualSettingsManager';

export default function useActionTooltips() {
  const [showActionTooltips, setShowActionTooltips] = useState(
    () => visualSettingsManager.getSettings().actionTooltips !== false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleSettingsChange = () => {
      setShowActionTooltips(visualSettingsManager.getSettings().actionTooltips !== false);
    };
    window.addEventListener('td-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('td-settings-changed', handleSettingsChange);
    };
  }, []);

  return showActionTooltips;
}
