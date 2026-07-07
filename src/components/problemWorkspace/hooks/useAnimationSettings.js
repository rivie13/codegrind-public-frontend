import { useEffect, useState } from 'react';

/**
 * Hook to manage animation settings based on screen resolution
 * @param {Object} options
 * @param {boolean} options.defaultEnabled - Default state for animations
 * @param {number} options.highResThreshold - Width threshold to consider high resolution (default 1920)
 * @returns {Object} Animation settings and toggle functions
 */
const useAnimationSettings = ({ defaultEnabled = true, highResThreshold = 1920 } = {}) => {
  // Check if we're in a high-res environment
  const [isHighRes, setIsHighRes] = useState(false);
  
  // Animation state settings
  const [animationsEnabled, setAnimationsEnabled] = useState(defaultEnabled);
  const [quality, setQuality] = useState('high'); // 'high', 'medium', 'low'
  
  // Settings for specific animations
  const [settings, setSettings] = useState({
    gridAnimation: { enabled: defaultEnabled, opacity: 0.2, speed: 30 },
    scanLineAnimation: { enabled: defaultEnabled, opacity: 0.5, speed: 5 },
    glitchEffects: { enabled: defaultEnabled, intensity: 1 },
    matrixEffects: { enabled: defaultEnabled, intensity: 1 }
  });

  // Check resolution on mount and resize
  useEffect(() => {
    const checkResolution = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isHighResolution = width > highResThreshold || height > 1080;
      
      //console.log('[DEBUG] Animation settings - Screen size:', width, 'x', height, 'High-res:', isHighResolution);
      
      setIsHighRes(isHighResolution);
      
      // Auto-adjust settings based on resolution
      if (isHighResolution) {
        // For high-res screens, automatically reduce animation intensity
        setQuality('medium');
        setSettings({
          gridAnimation: { 
            enabled: animationsEnabled, 
            opacity: 0.1, // Reduced opacity
            speed: 60 // Slower animation
          },
          scanLineAnimation: { 
            enabled: animationsEnabled, 
            opacity: 0.3, // Reduced opacity
            speed: 8 // Slower animation
          },
          glitchEffects: { 
            enabled: animationsEnabled, 
            intensity: 0.7 // Reduced intensity
          },
          matrixEffects: { 
            enabled: animationsEnabled, 
            intensity: 0.7 // Reduced intensity
          }
        });
      } else {
        // Standard settings for 1080p
        setQuality('high');
        setSettings({
          gridAnimation: { 
            enabled: animationsEnabled, 
            opacity: 0.2,
            speed: 30
          },
          scanLineAnimation: { 
            enabled: animationsEnabled, 
            opacity: 0.5,
            speed: 5
          },
          glitchEffects: { 
            enabled: animationsEnabled, 
            intensity: 1
          },
          matrixEffects: { 
            enabled: animationsEnabled, 
            intensity: 1
          }
        });
      }

      // For 4K screens, use even more conservative settings
      if (width >= 3840 || height >= 2160) {
        //console.log('[DEBUG] Animation settings - 4K detected, using low settings');
        setQuality('low');
        setSettings(prev => ({
          ...prev,
          gridAnimation: { 
            ...prev.gridAnimation,
            opacity: 0.05,
            speed: 90
          },
          scanLineAnimation: { 
            enabled: false // Disable scan line completely for 4K
          }
        }));
      }
    };
    
    checkResolution();
    window.addEventListener('resize', checkResolution);
    return () => window.removeEventListener('resize', checkResolution);
  }, [highResThreshold, animationsEnabled]);

  // Toggle all animations
  const toggleAnimations = () => {
    const newState = !animationsEnabled;
    //console.log('[DEBUG] Animation settings - Toggling animations:', newState);
    setAnimationsEnabled(newState);
    
    // Update all animation settings
    setSettings(prev => ({
      gridAnimation: { ...prev.gridAnimation, enabled: newState },
      scanLineAnimation: { ...prev.scanLineAnimation, enabled: newState },
      glitchEffects: { ...prev.glitchEffects, enabled: newState },
      matrixEffects: { ...prev.matrixEffects, enabled: newState }
    }));
  };

  // Toggle specific animation
  const toggleAnimation = (animationName) => {
    setSettings(prev => ({
      ...prev,
      [animationName]: {
        ...prev[animationName],
        enabled: !prev[animationName].enabled
      }
    }));
  };

  // Set quality level
  const setAnimationQuality = (level) => {
    //console.log('[DEBUG] Animation settings - Setting quality to:', level);
    setQuality(level);
    
    // Adjust settings based on quality level
    switch(level) {
      case 'high':
        setSettings({
          gridAnimation: { enabled: animationsEnabled, opacity: 0.2, speed: 30 },
          scanLineAnimation: { enabled: animationsEnabled, opacity: 0.5, speed: 5 },
          glitchEffects: { enabled: animationsEnabled, intensity: 1 },
          matrixEffects: { enabled: animationsEnabled, intensity: 1 }
        });
        break;
      case 'medium':
        setSettings({
          gridAnimation: { enabled: animationsEnabled, opacity: 0.1, speed: 60 },
          scanLineAnimation: { enabled: animationsEnabled, opacity: 0.3, speed: 8 },
          glitchEffects: { enabled: animationsEnabled, intensity: 0.7 },
          matrixEffects: { enabled: animationsEnabled, intensity: 0.7 }
        });
        break;
      case 'low':
        setSettings({
          gridAnimation: { enabled: animationsEnabled, opacity: 0.05, speed: 90 },
          scanLineAnimation: { enabled: false },
          glitchEffects: { enabled: animationsEnabled, intensity: 0.4 },
          matrixEffects: { enabled: animationsEnabled, intensity: 0.4 }
        });
        break;
      case 'none':
        setSettings({
          gridAnimation: { enabled: false, opacity: 0, speed: 0 },
          scanLineAnimation: { enabled: false, opacity: 0, speed: 0 },
          glitchEffects: { enabled: false, intensity: 0 },
          matrixEffects: { enabled: false, intensity: 0 }
        });
        break;
      default:
        break;
    }
  };

  // For debugging
  // console.log('[DEBUG] useAnimationSettings - Current state:', { 
  //   isHighRes, 
  //   animationsEnabled, 
  //   quality 
  // });

  return {
    isHighRes,
    animationsEnabled,
    settings,
    quality,
    toggleAnimations,
    toggleAnimation,
    setAnimationQuality
  };
};

export default useAnimationSettings; 