import { useEffect } from 'react';

export default function useAICodeGenerationBridge({ setIsGeneratingAICode, setCurrentTowerType }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    window.setIsGeneratingAICode = (value) => {
      setIsGeneratingAICode(Boolean(value));
    };

    window.setCurrentTowerType = (value) => {
      setCurrentTowerType(value || '');
    };

    return () => {
      delete window.setIsGeneratingAICode;
      delete window.setCurrentTowerType;
    };
  }, [setCurrentTowerType, setIsGeneratingAICode]);
}
