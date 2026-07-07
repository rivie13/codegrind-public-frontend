import { Box } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';

// Cyberpunk highlight animations
const pulseHighlight = keyframes`
  0%, 100% { 
    border-color: #ff4444;
    box-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
    transform: scale(1);
  }
  50% { 
    border-color: #ff8888;
    box-shadow: 0 0 40px rgba(255, 68, 68, 1.0);
    transform: scale(1.02);
  }
`;

const arrowBounce = keyframes`
  0%, 100% { transform: translate(0px, 0px); }
  50% { transform: translate(-3px, -3px); }
`;

const scanHighlight = keyframes`
  0% { 
    background-position: -100% 0;
    opacity: 0.3;
  }
  100% { 
    background-position: 100% 0;
    opacity: 0.8;
  }
`;

const TutorialHighlight = ({
  targetElement = null,
  isActive = false,
  highlightType = 'pulse',
  showArrow = false,
  popupElement = null,
  color = '#ff4444',
  glowColor = 'rgba(255, 68, 68, 0.8)',
  offset = 5
}) => {
  const highlightRef = useRef(null);
  const [targetRect, setTargetRect] = useState(null);
  const [popupRect, setPopupRect] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate target element position and size
  const updateTargetPosition = () => {
    if (!targetElement || !isActive) {
      setIsVisible(false);
      return;
    }

    let target = null;
    
    // Handle string selector or direct element reference
    if (typeof targetElement === 'string') {
      target = document.querySelector(targetElement);
      //console.log('[TUTORIAL HIGHLIGHT] Looking for element:', targetElement, 'Found:', target);
    } else if (targetElement && targetElement.current) {
      target = targetElement.current;
    } else if (targetElement instanceof Element) {
      target = targetElement;
    }

    if (target) {
      const rect = target.getBoundingClientRect();
      //console.log('[TUTORIAL HIGHLIGHT] Target element rect:', rect);
      setTargetRect({
        top: rect.top - offset,
        left: rect.left - offset,
        width: rect.width + (offset * 2),
        height: rect.height + (offset * 2),
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      });
      setIsVisible(true);
    } else {
      //console.log('[TUTORIAL HIGHLIGHT] Target element not found for:', targetElement);
      setIsVisible(false);
    }
  };

  // Calculate popup position for arrow calculation
  const updatePopupPosition = () => {
    if (!showArrow || !popupElement) return;

    let popup = null;
    
    // Handle string selector or direct element reference
    if (typeof popupElement === 'string') {
      popup = document.querySelector(popupElement);
    } else if (popupElement && popupElement.current) {
      popup = popupElement.current;
    } else if (popupElement instanceof Element) {
      popup = popupElement;
    }

    if (popup) {
      const rect = popup.getBoundingClientRect();
      setPopupRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        center: {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      });
    }
  };

  // Update positions when target or active state changes
  useEffect(() => {
    updateTargetPosition();
    updatePopupPosition();
    
    // If target element is not found immediately, retry a few times
    // This helps with elements that are dynamically created
    if (targetElement && typeof targetElement === 'string' && !document.querySelector(targetElement)) {
      //console.log('[TUTORIAL HIGHLIGHT] Target element not immediately found, setting up retry mechanism');
      
      let retryCount = 0;
      const maxRetries = 10;
      const retryInterval = setInterval(() => {
        retryCount++;
        const element = document.querySelector(targetElement);
        
        if (element) {
          //console.log('[TUTORIAL HIGHLIGHT] Target element found on retry:', retryCount);
          clearInterval(retryInterval);
          updateTargetPosition();
          updatePopupPosition();
        } else if (retryCount >= maxRetries) {
          //console.log('[TUTORIAL HIGHLIGHT] Max retries reached, giving up on:', targetElement);
          clearInterval(retryInterval);
        }
      }, 200);
      
      return () => clearInterval(retryInterval);
    }
  }, [targetElement, popupElement, isActive, offset, showArrow]);

  // Force update when targetElement changes
  useEffect(() => {
    if (targetElement && isActive) {
      //console.log('[TUTORIAL HIGHLIGHT] Target element changed to:', targetElement);
      // Force immediate update
      setTimeout(() => {
        updateTargetPosition();
        updatePopupPosition();
      }, 100);
    }
  }, [targetElement]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => {
      updateTargetPosition();
      updatePopupPosition();
    };

    const handleScroll = () => {
      updateTargetPosition();
      updatePopupPosition();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleScroll, true);
    
    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleScroll, true);
      observer.disconnect();
    };
  }, [isActive]);

  // Calculate arrow line and pointer from popup to target
  const getArrowComponents = () => {
    if (!showArrow || !targetRect || !popupRect) return null;

    const isSmallScreen = window.innerWidth <= 768;
    const arrowSize = isSmallScreen ? 10 : 12;
    const lineWidth = isSmallScreen ? 2 : 3;
    
    // Calculate vector from popup center to target center
    const deltaX = targetRect.center.x - popupRect.center.x;
    const deltaY = targetRect.center.y - popupRect.center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 50) return null; // Too close, don't show arrow
    
    // Normalize the vector
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    
    // Calculate popup edge point (start of arrow line)
    // Use a more intelligent edge calculation based on popup size and direction
    const popupRadius = Math.min(popupRect.width, popupRect.height) / 2;
    const popupEdgeDistance = Math.max(popupRadius * 0.8, 20); // Minimum 20px from center
    const lineStartX = popupRect.center.x + unitX * popupEdgeDistance;
    const lineStartY = popupRect.center.y + unitY * popupEdgeDistance;
    
    // Calculate target edge point (end of arrow line)  
    // Stop the arrow just outside the target highlight
    const targetRadius = Math.min(targetRect.width, targetRect.height) / 2;
    const targetEdgeDistance = Math.max(targetRadius * 0.9, 25); // Minimum 25px from center
    const lineEndX = targetRect.center.x - unitX * targetEdgeDistance;
    const lineEndY = targetRect.center.y - unitY * targetEdgeDistance;
    
    // Ensure arrow line has a reasonable length
    const lineLength = Math.sqrt((lineEndX - lineStartX)**2 + (lineEndY - lineStartY)**2);
    if (lineLength < 30) return null; // Line too short to be useful
    
    // Calculate arrow head angle
    const angle = Math.atan2(deltaY, deltaX);
    
    // Arrow head points - make it more prominent (adjust for screen size)
    const arrowHeadLength = isSmallScreen ? 14 : 18;
    const arrowHeadAngle = Math.PI / 5; // Slightly wider angle for better visibility
    
    const arrowX1 = lineEndX - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
    const arrowY1 = lineEndY - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
    const arrowX2 = lineEndX - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
    const arrowY2 = lineEndY - arrowHeadLength * Math.sin(angle + arrowHeadAngle);

    return {
      line: {
        x1: lineStartX,
        y1: lineStartY,
        x2: lineEndX,
        y2: lineEndY,
        length: lineLength
      },
      arrowHead: {
        points: `${lineEndX},${lineEndY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`,
        centerX: lineEndX,
        centerY: lineEndY
      }
    };
  };

  if (!isActive || !isVisible || !targetRect) {
    return null;
  }

  // Different highlight styles based on type
  const getHighlightStyles = () => {
    const isSmallScreen = window.innerWidth <= 768;
    const baseStyles = {
      position: 'fixed',
      top: `${targetRect.top}px`,
      left: `${targetRect.left}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
      pointerEvents: 'none',
      zIndex: 9998,
      borderRadius: isSmallScreen ? '3px' : '4px'
    };

    switch (highlightType) {
      case 'pulse':
        return {
          ...baseStyles,
          border: isSmallScreen ? `2px solid ${color}` : `3px solid ${color}`,
          boxShadow: isSmallScreen 
            ? `0 0 15px ${glowColor}`
            : `0 0 20px ${glowColor}`,
          animation: `${pulseHighlight} 2s infinite ease-in-out`,
          background: 'transparent'
        };
      case 'glow':
        return {
          ...baseStyles,
          border: isSmallScreen ? `1px solid ${color}` : `2px solid ${color}`,
          boxShadow: isSmallScreen
            ? `0 0 20px ${glowColor}, inset 0 0 10px ${glowColor}`
            : `0 0 30px ${glowColor}, inset 0 0 15px ${glowColor}`,
          background: `linear-gradient(45deg, ${glowColor}20, transparent)`,
          backdropFilter: 'brightness(1.2)'
        };
      case 'scan':
        return {
          ...baseStyles,
          border: isSmallScreen ? `1px solid ${color}` : `2px solid ${color}`,
          background: `linear-gradient(90deg, transparent, ${glowColor}50, transparent)`,
          backgroundSize: '200% 100%',
          animation: `${scanHighlight} 2s infinite linear`
        };
      case 'outline':
        return {
          ...baseStyles,
          border: isSmallScreen ? `2px dashed ${color}` : `3px dashed ${color}`,
          boxShadow: isSmallScreen
            ? `0 0 10px ${glowColor}`
            : `0 0 15px ${glowColor}`,
          background: 'transparent'
        };
      default:
        return baseStyles;
    }
  };

  const arrowComponents = getArrowComponents();
  const isSmallScreen = window.innerWidth <= 768;

  return (
    <>
      {/* Target highlight box */}
      <Box
        ref={highlightRef}
        sx={getHighlightStyles()}
      >
        {/* Additional scan line effect for certain highlight types */}
        {highlightType === 'pulse' && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            height="2px"
            background={`linear-gradient(90deg, transparent, ${color}, transparent)`}
            animation={`${scanHighlight} 3s infinite linear`}
          />
        )}
      </Box>

      {/* Arrow pointing from popup to target (separate from highlight) */}
      {showArrow && arrowComponents && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          pointerEvents="none"
          zIndex={9997}
          sx={{
            animation: `${arrowBounce} 3s infinite ease-in-out`
          }}
        >
          {/* SVG for precise arrow drawing */}
          <svg
            width="100%"
            height="100%"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0,
              overflow: 'visible'
            }}
          >
            {/* Arrow line */}
            <line
              x1={arrowComponents.line.x1}
              y1={arrowComponents.line.y1}
              x2={arrowComponents.line.x2}
              y2={arrowComponents.line.y2}
              stroke={color}
              strokeWidth={isSmallScreen ? "2" : "3"}
              strokeDasharray="8,4"
              filter={`drop-shadow(0 0 ${isSmallScreen ? 6 : 8}px ${glowColor})`}
              opacity="0.9"
            />
            
            {/* Arrow head */}
            <polygon
              points={arrowComponents.arrowHead.points}
              fill={color}
              stroke={color}
              strokeWidth="1"
              filter={`drop-shadow(0 0 ${isSmallScreen ? 6 : 8}px ${glowColor})`}
            />
            
            {/* Glowing dot at arrow tip for extra visibility */}
            <circle
              cx={arrowComponents.arrowHead.centerX}
              cy={arrowComponents.arrowHead.centerY}
              r={isSmallScreen ? "3" : "4"}
              fill={color}
              filter={`drop-shadow(0 0 ${isSmallScreen ? 10 : 12}px ${glowColor})`}
              opacity="0.8"
            />
          </svg>
        </Box>
      )}
    </>
  );
};

export default TutorialHighlight; 