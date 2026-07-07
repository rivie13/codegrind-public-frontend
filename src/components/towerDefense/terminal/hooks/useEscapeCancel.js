import { useEffect } from 'react';

const useEscapeCancel = ({ isActive, onCancelPlacement }) => {
  useEffect(() => {
    if (!onCancelPlacement || !isActive || typeof window === 'undefined') return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onCancelPlacement('escape');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActive, onCancelPlacement]);
};

export default useEscapeCancel;
