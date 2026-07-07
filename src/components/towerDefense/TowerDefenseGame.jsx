import { useEffect } from 'react';

// Effect for processing terminal messages - force immediate scroll
useEffect(() => {
  if (showTerminal && terminalRef.current) {
    // Always scroll to the bottom when terminal output changes
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    
    // If player has won, check if victory screen needs to be displayed
    if (playerWon && !window._victoryScreenDisplayed) {
      try {
        //console.log("[DEBUG] Player won, checking if victory screen is displayed");
        
        // Check if we've already tried to display the victory screen
        if (terminalRef.current._victoryDisplayed) {
          //console.log("[DEBUG] Victory screen already attempted via terminalRef");
          return;
        }
        
        // Mark that we're displaying the victory screen
        terminalRef.current._victoryDisplayed = true;
        
        // Small timeout to ensure state has settled
        setTimeout(() => {
          if (terminalRef.current) {
            // Try to find terminal content element
            const selectors = [
              '.terminal-content', 
              '.terminal-scrollable',
              '[class*="terminal"]'
            ];
            
            let terminalContent = null;
            for (const selector of selectors) {
              const element = terminalRef.current.querySelector(selector);
              if (element) {
                terminalContent = element;
                break;
              }
            }
            
            // Check if terminal content exists and doesn't already have victory message
            const contentText = terminalContent ? 
              (terminalContent.textContent || terminalContent.innerText || '') : '';
            
            if (terminalContent && !contentText.includes('System breach complete')) {
              //console.log('[DEBUG] Victory screen missing, calling game event');
              
              // Set global flag to prevent future attempts
              window._victoryScreenDisplayed = true;
              
              // Call showVictoryScreen with current state
              gameState.handleGameEvent('victory-screen', {
                finalCredits: credits,
                finalLives: lives,
                timer,
                formattedTime,
                codeSubmissionSuccess,
                submitTowerDefenseScore,
              });
            }
          }
        }, 300);
      } catch (err) {
        console.error('[DEBUG] Error checking terminal content:', err);
      }
    }
  }
}, [showTerminal, terminalOutput, playerWon, credits, lives, timer, formattedTime, codeSubmissionSuccess, gameState]); 