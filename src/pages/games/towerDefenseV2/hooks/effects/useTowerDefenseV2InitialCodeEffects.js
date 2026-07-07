/**
 * Tower Defense V2 - Initial Code Effects
 */

import { useEffect, useRef } from 'react';

export default function useTowerDefenseV2InitialCodeEffects({ initialCodeGenerated }) {
  const initialCodeEventRef = useRef(false);

  useEffect(() => {
    if (initialCodeGenerated && !initialCodeEventRef.current) {
      initialCodeEventRef.current = true;
      localStorage.setItem('_tower_defense_code_generated', 'true');
      document.body.classList.add('initial-code-generated');
      document.dispatchEvent(new CustomEvent('codegen-complete'));
    }

    if (!initialCodeGenerated) {
      initialCodeEventRef.current = false;
    }
  }, [initialCodeGenerated]);
}
