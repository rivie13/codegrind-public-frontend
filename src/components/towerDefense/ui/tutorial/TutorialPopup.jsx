import {
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Progress,
    Text,
    VStack,
    useMediaQuery
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';

// Cyberpunk animations
const tutorialSlideIn = keyframes`
  0% { 
    transform: translateY(-50px); 
    opacity: 0; 
    filter: blur(10px); 
  }
  100% { 
    transform: translateY(0); 
    opacity: 1; 
    filter: blur(0px); 
  }
`;

const scanLine = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

const TutorialPopup = forwardRef(({
  step = 1,
  isDemo = false,
  onNextStep,
  onPreviousStep,
  onSkipTutorial,
  onCompleteStep,
  targetElement = null,
  placement = 'center',
  allowOverlap = false,
  showProgress = true,
  canSkip = true,
  tutorialContent = {},
  totalSteps = 10,
  isVisible = true
}, ref) => {
  const internalRef = useRef(null);
  const popupRef = ref || internalRef;
  const [position, setPosition] = useState({ x: 0, y: 0, finalPlacement: placement });
  const [isPositioned, setIsPositioned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [manualPosition, setManualPosition] = useState(null);
  
  // Detect actual screen sizes - 720p displays need compact mode
  // 720p = 1280x720, 1080p = 1920x1080
  const [is720pOrSmaller] = useMediaQuery('(max-height: 800px)');
  const [isVerySmallWidth] = useMediaQuery('(max-width: 768px)');
  const [isSmallWidth] = useMediaQuery('(max-width: 1400px)');
  
  // Determine size mode based on actual display
  const isCompactMode = is720pOrSmaller || isVerySmallWidth;

  // Dragging handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = popupRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setManualPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Reset manual position when step changes
  useEffect(() => {
    setManualPosition(null);
  }, [step]);

  // Smart positioning algorithm that avoids covering target elements
  const calculatePosition = () => {
    if (!popupRef.current) return;

    const popup = popupRef.current;
    const popupRect = popup.getBoundingClientRect();
    const viewport = { 
      width: window.innerWidth, 
      height: window.innerHeight 
    };
    
    // Use compact mode detection for positioning
    const isSmallScreen = isCompactMode || viewport.width <= 768;

    let newPosition = { x: 0, y: 0, finalPlacement: placement };

    // console.log('[TUTORIAL] Calculating position for step:', step, 'targetElement:', targetElement);

    // Helper function to check if popup overlaps with target
    const checkOverlap = (popupPos, targetRect) => {
      const popupRight = popupPos.x + popupRect.width;
      const popupBottom = popupPos.y + popupRect.height;
      
      return !(popupRight < targetRect.left || 
               popupPos.x > targetRect.right ||
               popupBottom < targetRect.top ||
               popupPos.y > targetRect.bottom);
    };

    const getPlacementOrder = (targetRect) => {
      const spaces = {
        left: targetRect.left,
        right: viewport.width - targetRect.right,
        top: targetRect.top,
        bottom: viewport.height - targetRect.bottom
      };

      const orderedBySpace = Object.entries(spaces)
        .sort((a, b) => b[1] - a[1])
        .map(([side]) => side);

      const base = placement && placement !== 'center' ? [placement] : [];
      return [...new Set([...base, ...orderedBySpace, 'bottom', 'top', 'right', 'left'])];
    };

    const getPositionForPlacement = (targetRect, tryPlacement, gap) => {
      const testPos = { x: 0, y: 0 };
      switch (tryPlacement) {
        case 'top':
          testPos.x = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
          testPos.y = targetRect.top - popupRect.height - gap;
          break;
        case 'bottom':
          testPos.x = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
          testPos.y = targetRect.bottom + gap;
          break;
        case 'left':
          testPos.x = targetRect.left - popupRect.width - gap;
          testPos.y = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
          break;
        case 'right':
          testPos.x = targetRect.right + gap;
          testPos.y = targetRect.top + (targetRect.height / 2) - (popupRect.height / 2);
          break;
        default:
          testPos.x = targetRect.left + (targetRect.width / 2) - (popupRect.width / 2);
          testPos.y = targetRect.bottom + gap;
          break;
      }
      return testPos;
    };

    // Helper function to try different placements and find one that doesn't overlap
    const findNonOverlappingPosition = (targetRect) => {
      const margin = 20;
      const gap = isSmallScreen ? 20 : 30;

      const placements = getPlacementOrder(targetRect);

      for (const tryPlacement of placements) {
        const testPos = getPositionForPlacement(targetRect, tryPlacement, gap);

        // Check if position is within viewport bounds
        const inBounds = testPos.x >= margin &&
                        testPos.x + popupRect.width <= viewport.width - margin &&
                        testPos.y >= margin &&
                        testPos.y + popupRect.height <= viewport.height - margin;

        // Check if it doesn't overlap with target
        const noOverlap = !checkOverlap(testPos, targetRect);

        if (inBounds && noOverlap) {
          // console.log('[TUTORIAL] Found non-overlapping position:', tryPlacement, testPos);
          return { ...testPos, finalPlacement: tryPlacement };
        }
      }

      // If no placement works, position off to the side with maximum visibility
      // On compact screens, position at top center
      if (isSmallScreen) {
        return {
          x: (viewport.width / 2) - (popupRect.width / 2),
          y: margin,
          finalPlacement: 'top-center'
        };
      } else {
        // On larger screens, try to position to the right side
        return {
          x: Math.max(margin, viewport.width - popupRect.width - margin),
          y: margin,
          finalPlacement: 'top-right'
        };
      }
    };

    // On small screens with no target or center placement
    if (isSmallScreen && (!targetElement || placement === 'center')) {
      newPosition.x = (viewport.width / 2) - (popupRect.width / 2);
      newPosition.y = Math.min(
        (viewport.height / 2) - (popupRect.height / 2),
        viewport.height - popupRect.height - 20
      );
      setPosition(newPosition);
      setIsPositioned(true);
      return;
    }

    if (targetElement && typeof targetElement === 'string') {
      const target = document.querySelector(targetElement);
      // console.log('[TUTORIAL] Target element found:', target, 'for selector:', targetElement);
      
      if (target) {
        const targetRect = target.getBoundingClientRect();
        // console.log('[TUTORIAL] Target rect:', targetRect);

        // Prefer non-overlapping placement even when overlap is allowed
        const nonOverlappingPos = findNonOverlappingPosition(targetRect);
        if (!allowOverlap || nonOverlappingPos) {
          newPosition = nonOverlappingPos || newPosition;
        } else {
          const gap = isSmallScreen ? 16 : 24;
          const margin = 20;
          const placements = getPlacementOrder(targetRect);
          const tryPlacement = placements[0] || placement;
          const overlapPos = getPositionForPlacement(targetRect, tryPlacement, gap);

          newPosition.x = Math.min(Math.max(overlapPos.x, margin), viewport.width - popupRect.width - margin);
          newPosition.y = Math.min(Math.max(overlapPos.y, margin), viewport.height - popupRect.height - margin);
          newPosition.finalPlacement = tryPlacement;
        }
      } else {
        // console.log('[TUTORIAL] Target element not found, using center positioning');
        // Center positioning as fallback
        newPosition.x = (viewport.width / 2) - (popupRect.width / 2);
        newPosition.y = (viewport.height / 2) - (popupRect.height / 2);
      }
    } else {
      // Center positioning for steps without targets
      newPosition.x = (viewport.width / 2) - (popupRect.width / 2);
      newPosition.y = (viewport.height / 2) - (popupRect.height / 2);
    }

    //console.log('[TUTORIAL] Calculated position:', newPosition);
    
    // Use manual position if user has dragged the popup
    if (manualPosition) {
      setPosition(manualPosition);
    } else {
      setPosition(newPosition);
    }
    setIsPositioned(true);
  };

  // Position the popup when step changes or component mounts
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(calculatePosition, 100);
      return () => clearTimeout(timer);
    }
  }, [step, targetElement, placement, allowOverlap, isVisible]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  if (!isVisible || !tutorialContent) return null;

  const currentContent = tutorialContent[step] || {
    title: "Tutorial Step",
    content: "Tutorial content",
    canSkip: true
  };

  // console.log('[TUTORIAL] TutorialPopup rendering:', {
  //   isVisible,
  //   step,
  //   targetElement,
  //   placement,
  //   currentContent: currentContent.title,
  //   isPositioned,
  //   position
  // });

  return (
    <>
      {/* Backdrop overlay that allows clicks through - lighter so users can see what's behind */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0, 0, 0, 0.15)"
        zIndex={9997}
        pointerEvents="none"
      />

      {/* Tutorial popup */}
      <Box
        ref={popupRef}
        position="fixed"
        left={`${manualPosition?.x ?? position.x}px`}
        top={`${manualPosition?.y ?? position.y}px`}
        zIndex={9999}
        maxWidth={isCompactMode ? "280px" : (isSmallWidth ? "450px" : "600px")}
        minWidth={isCompactMode ? "260px" : (isSmallWidth ? "400px" : "500px")}
        width={isVerySmallWidth ? "85vw" : "auto"}
        maxHeight={isCompactMode ? "85vh" : "90vh"}
        opacity={isPositioned ? 1 : 0}
        animation={isPositioned ? `${tutorialSlideIn} 0.5s ease-out` : 'none'}
        bg="linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 60, 0.95) 100%)"
        border={isCompactMode ? "1px solid #00ff88" : "2px solid #00ff88"}
        borderRadius={isCompactMode ? "6px" : "8px"}
        boxShadow="0 0 30px rgba(0, 255, 136, 0.5), inset 0 0 20px rgba(0, 255, 136, 0.1)"
        overflow="hidden"
        pointerEvents="auto"
        cursor={isDragging ? 'grabbing' : 'default'}
        userSelect={isDragging ? 'none' : 'auto'}
        transition={isDragging ? 'none' : 'all 0.3s ease'}
        sx={{
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
            animation: `${scanLine} 2s linear infinite`,
          }
        }}
      >
        {/* Header */}
        <Box 
          p={isCompactMode ? 2 : 4} 
          pb={isCompactMode ? 1 : 2}
          onMouseDown={handleMouseDown}
          cursor={isDragging ? 'grabbing' : 'grab'}
          position="relative"
        >
          <Text 
            position="absolute" 
            top={isCompactMode ? "2px" : "4px"}
            right={isCompactMode ? "30px" : "40px"}
            fontSize={isCompactMode ? "0.5rem" : "0.65rem"}
            color="#66ccff"
            opacity={0.6}
            pointerEvents="none"
          >
            ⇄ Drag to move
          </Text>
          <Flex justify="space-between" align="center" mb={isCompactMode ? 0.5 : 2}>
            <Heading 
              size={isCompactMode ? "xs" : "md"}
              fontSize={isCompactMode ? "0.7rem" : (isSmallWidth ? "0.95rem" : "1.1rem")}
              color="#00ff88"
              fontFamily="'Orbitron', sans-serif"
              letterSpacing={isCompactMode ? "0.3px" : "1px"}
              textShadow="0 0 10px rgba(0, 255, 136, 0.5)"
              lineHeight="1.1"
            >
              {currentContent.title}
            </Heading>
            {canSkip && currentContent.canSkip && (
              <Button
                size="sm"
                variant="ghost"
                color="#ff6666"
                onClick={onSkipTutorial}
                _hover={{ bg: 'rgba(255, 102, 102, 0.1)' }}
              >
                <FaTimes />
              </Button>
            )}
          </Flex>

          {/* Progress bar */}
          {showProgress && (
            <VStack spacing={isCompactMode ? 1 : 2} align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize={isCompactMode ? "2xs" : "xs"} color="#66ccff">
                  Step {step} of {totalSteps}
                </Text>
                <Text fontSize={isCompactMode ? "2xs" : "xs"} color="#66ccff">
                  {Math.round((step / totalSteps) * 100)}% Complete
                </Text>
              </Flex>
              <Progress 
                value={(step / totalSteps) * 100}
                size="sm"
                bg="rgba(0, 0, 0, 0.3)"
                sx={{
                  '& > div': {
                    background: 'linear-gradient(90deg, #00ff88, #66ffaa)',
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
                  }
                }}
              />
            </VStack>
          )}
        </Box>

        {/* Content */}
        <Box 
          p={isCompactMode ? 2 : 4} 
          pt={isCompactMode ? 1 : 2}
          maxHeight={isCompactMode ? "50vh" : "60vh"}
          overflowY="auto"
          sx={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.2)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#00ff88',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#00cc66',
            },
          }}
        >
          <Box 
            color="#aaccff" 
            lineHeight={isCompactMode ? "1.3" : "1.6"}
            fontSize={isCompactMode ? "0.65rem" : (isSmallWidth ? "0.8rem" : "0.875rem")}
            fontFamily="monospace"
            dangerouslySetInnerHTML={{ 
              __html: currentContent.content 
            }}
            sx={{
              '& p': {
                marginBottom: isCompactMode ? '0.25rem' : '0.5rem'
              },
              '& ul, & ol': {
                marginLeft: isCompactMode ? '0.8em' : '1.5em',
                marginBottom: isCompactMode ? '0.25rem' : '0.5rem'
              },
              '& li': {
                marginBottom: isCompactMode ? '0.1rem' : '0.25rem'
              },
              '& br': {
                display: isCompactMode ? 'none' : 'block'
              },
              '& strong': {
                fontSize: isCompactMode ? '0.65rem' : (isSmallWidth ? '0.8rem' : '0.875rem')
              }
            }}
          />
        </Box>

        {/* Footer with navigation */}
        <Box p={isCompactMode ? 2 : 4} pt={isCompactMode ? 1 : 2} borderTop="1px solid rgba(0, 255, 136, 0.2)">
          <HStack justify="space-between" spacing={isCompactMode ? 1 : 2}>
            <Button
              size="xs"
              fontSize={isCompactMode ? "0.6rem" : (isSmallWidth ? "0.75rem" : "0.875rem")}
              variant="outline"
              colorScheme="blue"
              onClick={onPreviousStep}
              disabled={step <= 1}
              leftIcon={<FaArrowLeft />}
              opacity={step <= 1 ? 0.5 : 1}
              _hover={step <= 1 ? {} : { bg: 'rgba(0, 100, 255, 0.1)' }}
              px={isCompactMode ? 2 : 4}
            >
              <Text display={isVerySmallWidth ? "none" : "inline"}>Previous</Text>
              <Text display={isVerySmallWidth ? "inline" : "none"}>Prev</Text>
            </Button>

            <HStack spacing={isCompactMode ? 1 : 2}>
              {canSkip && currentContent.canSkip && (
                <Button
                  size="xs"
                  fontSize={isCompactMode ? "0.55rem" : (isSmallWidth ? "0.7rem" : "0.875rem")}
                  variant="ghost"
                  color="#ffaa66"
                  onClick={onSkipTutorial}
                  _hover={{ bg: 'rgba(255, 170, 102, 0.1)' }}
                  px={isCompactMode ? 1 : (isSmallWidth ? 2 : 3)}
                  display={isVerySmallWidth ? "none" : "flex"}
                >
                  Skip Tutorial
                </Button>
              )}
              
              <Button
                size="xs"
                fontSize={isCompactMode ? "0.6rem" : (isSmallWidth ? "0.75rem" : "0.875rem")}
                bg="linear-gradient(45deg, #00ff88, #66ffaa)"
                color="black"
                fontWeight="bold"
                onClick={step >= totalSteps ? onCompleteStep : onNextStep}
                rightIcon={step >= totalSteps ? null : <FaArrowRight size={isCompactMode ? 10 : 12} />}
                _hover={{ 
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.8)'
                }}
                px={isCompactMode ? 2 : 4}
              >
                {step >= totalSteps ? (
                  <>
                    <Text display={isVerySmallWidth ? "none" : "inline"}>START HACKING! 🔥</Text>
                    <Text display={isVerySmallWidth ? "inline" : "none"}>START! 🔥</Text>
                  </>
                ) : 'Continue'}
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>
    </>
  );
});

TutorialPopup.displayName = 'TutorialPopup';

export default TutorialPopup; 