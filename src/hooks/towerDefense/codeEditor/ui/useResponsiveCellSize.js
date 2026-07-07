import { useEffect, useState } from 'react';

/**
 * Custom hook to calculate responsive cell size for the tower defense game board
 * based on available viewport height
 * 
 * @returns {number} Optimal cell size in pixels
 */
const useResponsiveCellSize = () => {
  const calculateCellSize = () => {
    const viewportHeight = window.innerHeight;
    
    // Balanced cellSize reduction - smaller grid but not too cramped
    
    if (viewportHeight >= 1080) {
      return 50; // Full size for 1080p+
    } else if (viewportHeight >= 900) {
      return 42; // 16% smaller for 900-1079px screens
    } else if (viewportHeight >= 768) {
      return 35; // 30% smaller for 768-899px screens (720p range)
    } else if (viewportHeight >= 600) {
      return 30; // 40% smaller for 600-767px screens
    } else {
      return 26; // 48% smaller for very small screens
    }
  };

  const [cellSize, setCellSize] = useState(calculateCellSize);

  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return cellSize;
};

export default useResponsiveCellSize;
