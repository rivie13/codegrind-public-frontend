export const updates2025 = [
  {
    id: '1.10.0',
    heading: 'Version 1.10.0',
    release: 'Released: 10/16/2025 - Critical Hotfix',
    accentColor: '#FF00DE',
    sections: [
      {
        title: '🔥 Critical Hotfix',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          {
            title: 'Judge0 Queue Module Import Fix:',
            markerColor: '#00FFFF',
            items: [
              "Fixed critical production bug where judge0Queue module wasn't properly imported",
              'Resolved code execution failures across all problem types',
              'Restored full functionality to code submission and testing features'
            ]
          }
        ]
      },
      {
        title: 'Performance & Infrastructure',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'Judge0 Request Queue System:',
            markerColor: '#00FF8C',
            items: [
              'Implemented intelligent request queueing to prevent VM overload',
              'Configurable concurrent request limits (default: 2 for low-tier VMs)',
              'FIFO (First In, First Out) request processing with automatic retry handling',
              'Added admin monitoring endpoint for queue health statistics',
              'Improved system stability under high load conditions'
            ]
          },
          {
            title: 'VM Management Enhancements:',
            markerColor: '#00FF8C',
            items: [
              'Fixed VM shutdown timer to prevent duplicate stop messages in Azure Queue',
              'Enhanced message tracking with unique request IDs and timestamps',
              'Improved logging for better debugging and monitoring'
            ]
          }
        ]
      },
      {
        title: 'Security Improvements',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'CSRF Protection:',
            markerColor: '#00FF8C',
            items: [
              'Implemented comprehensive CSRF token system for all state-changing operations',
              'Added automatic token fetching and validation in frontend API service',
              'Enhanced protection against cross-site request forgery attacks'
            ]
          }
        ]
      },
      {
        title: 'Game Enhancements',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'Interactive Tutorial System:',
            markerColor: '#00FF8C',
            items: [
              'Comprehensive step-by-step tutorial popups for game mechanics',
              'Dynamic element highlighting for critical actions',
              'Progress tracking throughout the tutorial flow',
              'Settings menu integration for tutorial controls'
            ]
          },
          {
            title: 'Tower Defense Improvements:',
            markerColor: '#00FF8C',
            items: [
              'Enhanced user stats and achievement tracking integration',
              'Improved success modal with better visual feedback',
              'Enhanced chat UI with full markdown support',
              'New Corporate Dossier component for problem information',
              'Neural interface animation and jack-in functionality',
              'Refined verification logic and demo mode handling'
            ]
          }
        ]
      },
      {
        title: 'Developer Experience',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Improved logging system with environment-based conditional logging',
          'Enhanced error handling and debugging capabilities',
          'Better code organization and cleanup for tower defense components',
          'Removed unnecessary debug console logs for improved performance',
          'AI problem score handling refactored with improved lookup logic'
        ]
      }
    ]
  },
  {
    id: '1.9.0',
    heading: 'Version 1.9.0',
    release: 'Released: 5/20/2025',
    accentColor: '#00FFFF',
    sections: [
      {
        title: 'Platform Enhancements',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'Google Analytics Integration:',
            markerColor: '#00FF8C',
            items: [
              'Successfully integrated Google Analytics for comprehensive usage tracking and site performance insights.'
            ]
          },
          {
            title: 'Performance & Stability:',
            markerColor: '#00FF8C',
            items: [
              'Implemented various backend and frontend optimizations to improve overall site stability and responsiveness.'
            ]
          },
          {
            title: 'Cost Optimization & Security:',
            markerColor: '#00FF8C',
            items: [
              'Deployed VM auto-shutdown strategy to enhance resource management and reduce operational costs.',
              'Integrated Azure Key Vault for robust and secure management of all application secrets.'
            ]
          }
        ]
      },
      {
        title: 'Development & Deployment Updates',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: ['Numerous minor bug fixes and UI tweaks across the application.']
      }
    ]
  },
  {
    id: '1.8.0',
    heading: 'Version 1.8.0',
    release: 'Released: 5/15/2025',
    accentColor: '#FF00DE',
    sections: [
      {
        title: 'Tower Defense Game Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          {
            title: 'Performance Optimizations:',
            markerColor: '#00FFFF',
            items: [
              'Significant performance improvements across all game components',
              'Resolution-specific adjustments for enemies and projectiles',
              'Optimized render cycles and collision detection',
              'Reduced memory usage during extended gameplay sessions'
            ]
          },
          {
            title: 'Enhanced Visual Experience:',
            markerColor: '#00FFFF',
            items: [
              'Improved animations throughout the gameplay',
              'Smooth tower placement and upgrade animations',
              'Enhanced projectile and enemy visual effects',
              'Polished UI transitions and feedback elements'
            ]
          }
        ]
      },
      {
        title: 'UI/UX Enhancements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          {
            title: 'Loading Screens:',
            markerColor: '#00FFFF',
            items: [
              'Added informative loading screens throughout the application',
              'Implemented progress indicators with helpful tips',
              'Optimized asset loading to reduce wait times'
            ]
          },
          {
            title: 'Terminal UI Improvements:',
            markerColor: '#00FFFF',
            items: [
              'Completely redesigned tower defense terminal interface',
              'Enhanced readability with improved typography',
              'Better contrast and information hierarchy',
              'Streamlined command input and feedback mechanisms'
            ]
          }
        ]
      },
      {
        title: 'Bug Fixes',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Fixed projectile visibility issues in certain game scenarios',
          'Resolved UI scaling problems on ultra-wide displays'
        ]
      }
    ]
  },
  {
    id: '1.7.0',
    heading: 'Version 1.7.0',
    release: 'Released: 4/06/2025',
    accentColor: '#00FFFF',
    sections: [
      {
        title: 'Major Features',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          {
            title: 'Google Authentication Integration:',
            markerColor: '#FF00DE',
            items: [
              'Seamless sign-in using Google accounts',
              'Azure App Service backend integration',
              'Secure token handling and validation',
              'Profile synchronization with existing accounts'
            ]
          },
          {
            title: 'Code Breach Game Enhancements:',
            markerColor: '#FF00DE',
            items: [
              'Complete cyberpunk hacker aesthetic redesign',
              'Immersive sound effects and background music',
              'Enhanced terminal with optimized message queue',
              'Improved particle effects and animations',
              'Interactive ad integration with cyberpunk theme',
              'Fix for previously invisible projectiles'
            ]
          }
        ]
      },
      {
        title: 'UI/UX Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Added ad integration to chat panel',
          'Redesigned terminal with glitch effects and performance optimizations',
          'Seamless code editor and terminal integration',
          'Enhanced responsive layout for all screen sizes',
          'Cyberpunk-themed fonts and visual elements',
          'Settings menu for audio controls and preferences'
        ]
      },
      {
        title: 'Audio Enhancements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Comprehensive sound effects library',
          'Multiple cyberpunk-themed background music tracks',
          'Volume controls for individual audio categories',
          'Proper audio attribution in About page',
          'Performance optimizations for sound playback'
        ]
      }
    ]
  },
  {
    id: '1.5.0',
    heading: 'Version 1.5.0',
    release: 'Released: 4/1/2025',
    accentColor: '#FF00DE',
    sections: [
      {
        title: 'Major Features',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          {
            title: 'Tower Defense Game Beta:',
            markerColor: '#00FFFF',
            items: [
              'NOTE: This is a beta feature and may not work as expected. Please report any issues to the development team. Bugs are expected.',
              'Interactive learning experience through gameplay',
              'Algorithm-themed towers and test case themed enemies',
              'Unique level for each question',
              'Code editor integration for programming',
              'Code is generated by towers placed on map and refined by user input'
            ]
          },
          {
            title: 'Integrated Ad System:',
            markerColor: '#00FFFF',
            items: [
              'Top and bottom banner placements',
              'Sidebar ad integration',
              'Configurable ad slots via adSlots config'
            ]
          }
        ]
      },
      {
        title: 'UI Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Redesigned responsive layout system',
          'Consistent styling with dark mode optimization',
          'Fixed UI inconsistencies across mobile and desktop',
          'Enhanced navigation with improved user flows',
          'Optimized page templates for better performance'
        ]
      }
    ]
  },
  {
    id: '1.0.2',
    heading: 'Version 1.0.2',
    release: 'Released: 3/18/2025',
    accentColor: '#00FFFF',
    sections: [
      {
        title: 'Features & Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'UI overhaul with consistent styling across all pages',
          'Problem generation system completely rebuilt for better reliability',
          'New page templates and layout system for consistent user experience',
          'Enhanced error handling for AI problem generation',
          'Improved step tracking indicators with clearer status updates'
        ]
      },
      {
        title: 'Bug Fixes',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Fixed inconsistent UI styling between pages',
          'Fixed error state handling in problem generation',
          'Improved responsive design for smaller screens'
        ]
      }
    ]
  },
  {
    id: '1.0.1',
    heading: 'Version 1.0.1',
    release: 'Released: 3/10/2025',
    accentColor: '#FF00DE',
    sections: [
      {
        title: 'Features & Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Session fixes and stability improvements',
          'Foundation for AI problem generation laid out',
          'Enhanced error handling and logging for dev side of things...',
          'Improved authentication flow',
          'UI responsiveness enhancements'
        ]
      },
      {
        title: 'Bug Fixes',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: ['Fixed session timeout issues', 'Resolved UI issues']
      }
    ]
  },
  {
    id: '1.0.0',
    heading: 'Version 1.0.0',
    release: 'Released: February 21, 2025',
    accentColor: '#00FFFF',
    badge: { text: 'Initial Release', colorScheme: 'blue' },
    sections: [
      {
        title: 'Core Features',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'LeetCode problem integration',
          'Real-time code editor with syntax highlighting',
          'AI assistant for problem-solving guidance',
          'Difficulty-based problem filtering',
          'Responsive three-panel layout (Problem Description, Code Editor, AI Chat)',
          'User authentication system',
          'Real-time code execution',
          'Personalized user profiles',
          'Enhanced Scoring System',
          'Challenge Mode'
        ]
      }
    ]
  }
];
