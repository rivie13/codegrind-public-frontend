export const updates2026 = [
  {
    id: 'current',
    heading: 'Version 1.8.00 - MAJOR UPDATE',
    release: 'Released: 06/05/2026',
    accentColor: '#FFD700',
    badge: { text: 'Current', colorScheme: 'green' },
    sections: [
      {
        title: '🎮 Gameplay',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'Improved Tower Defense V2 mobile experience with more stable mode behavior.',
          'Refined error handling for TD mode to prevent false bug reports.',
          'Refined city mode UI and layout handling for smoother navigation and to prevent accidental text selection.',
          'NEW Retro Art style featured site wide: To increase immersion, we changed the site theme to be a retro desktop aesthetic, this allows for a smoother more immersive transition when users go between the city to the site and vice versa.',
        ],
      },
      {
        title: '📚 Learning',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Improved onboarding for learning path / pro path content with updated tutorial materials.',
          'Updated the beginner and pro color scheme to make track selection clearer and readable.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Enhanced city preview pages with better controls and a persistent keyboard help notice.',
          'Improved UI styling for a cleaner look across city screens.',
          'Improved city load times for initial load and switching between scenes.',
          'Added QoL features to the demo - users can now skip the intro city part and go straight to TD portion of the demo.',
        ],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Resolved multiple issues in city mode to reduce crashes and broken interactions.',
          'Fixed problems in review-style flow and improved consistency across related screens.',
          'Addressed multiple game breaking bugs that prevented progress in the demo and onboarding experience.',
          'Fixed guest migration issues to make sure all progress, xp, and data packets are properly transferred when users sign up for the site.',
          'Fixed guest token issues which caused guest progress to not track for a single user throughout their trial experience.',
          'Fixed issues with loading in assets for mobile mode which caused visual bugs and experience degradation.',
          'Addressed mobile code editor issues which caused the editor to break and become unusable for some users. Text does not get swallowed up by mobile code editor.',
        ],
      },
    ],
  },
  {
    id: '1.6.83',
    heading: 'Version 1.6.83',
    release: 'Released: 05/15/2026',
    accentColor: '#8B00FF',
    sections: [
      {
        title: '🎮 Gameplay',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Improved audio consistency in City mode so sounds stay in sync during play.',
          'Fixed avatar state handling in City mode to prevent occasional mismatches.',
          'Included quality-of-life fixes for TD and City modes to smooth out gameplay.',
        ],
      },
      {
        title: '📱 Mobile',
        color: '#E04545',
        markerColor: '#E04545',
        items: ['Made additional mobile improvements for more reliable controls and interactions.'],
      },
      {
        title: '🛠️ Improvements',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: ['Enhanced test coverage for CityMap behaviors to help prevent regressions.'],
      },
    ],
  },
  {
    id: '1.6.82',
    heading: 'Version 1.6.82',
    release: 'Released: 05/13/2026',
    accentColor: '#00FF8C',
    sections: [
      {
        title: '🎮 Gameplay',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'Enhanced the tower defense onboarding experience with smoother UI interactions.',
          'Improved how updates are noticed so you can get back into play faster.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Refined tracking for chat-related usage to improve in-game feedback.',
          'General demo fixes were merged to improve overall stability.',
        ],
      },
    ],
  },
  {
    id: '1.6.81',
    heading: 'Version 1.6.81',
    release: 'Released: 05/03/2026',
    accentColor: '#FF00DE',
    sections: [
      {
        title: '🎮 Gameplay',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Reworked the Integrated Tower Defense onboarding to make the flow clearer and more consistent.',
          'Improved slot locking and reveal steps during the early demo sequence.',
          'Enhanced tutorial guidance with more detailed callouts and tactical notes.',
        ],
      },
      {
        title: '🤖 AI & Tools',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: ['Added code completion support for Java, Python, and C++ in the editor.'],
      },
      {
        title: '🛠️ Improvements',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Polished onboarding and game-state tracking for smoother progress handling.',
          'Improved layout spacing and chat panel styling for better on-screen readability.',
          'Fixed various small issues to make the experience feel more responsive.',
        ],
      },
    ],
  },
  {
    id: '1.6.80',
    heading: 'Version 1.6.80',
    release: 'Released: 05/02/2026',
    accentColor: '#8B00FF',
    sections: [
      {
        title: '✨ New Features',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Guest submission scores and Tower Defense scores are now automatically transferred to your new account and credited to the leaderboard when you sign up — no progress lost!',
          'Guest XP earned during demo problem completion is now recorded and carried over when converting to a registered account.',
          'New leaderboard staging system ensures guest scores are fairly integrated the moment you create an account, with deduplication to prevent score inflation.',
        ],
      },
      {
        title: '🎮 Gameplay',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'Tower Defense success modal and Problem Workspace success modal have been updated for a smoother post-solve flow.',
          'Guest signup wall now clearly surfaces the score transfer feature so you know your hard-earned progress will carry over.',
          'Cluster map and cluster detail pages have received UI and data flow improvements.',
        ],
      },
      {
        title: '📚 Learning',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Solved problem difficulties are now matched more accurately across all identifier formats, fixing long-standing discrepancies in profile stats and solve counts.',
          'Profile stats endpoint now uses robust canonical problem slug resolution so your easy/medium/hard breakdowns are always correct, regardless of how a problem was originally solved.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Guest submission and score data pipeline is significantly more robust, ensuring zero data loss during account migration.',
          'Problem identifier normalization utilities guarantee consistent stats across different slug formats and historical solve records.',
          'Code submission scoring service improved for more reliable Judge0 result handling.',
          'Guest data cleanup now correctly handles the full set of associated records for safe, thorough session teardown.',
        ],
      },
      {
        title: '🧑‍💻 Infrastructure',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Added new database tables — GuestXpEvent, GuestSubmission, GuestProblemScore, and GuestTowerDefenseScore — to comprehensively track guest activity for analytics and leaderboard staging.',
          'Two new database migrations add guest leaderboard staging tables with proper indexes and foreign keys for efficient queries.',
          'Developer documentation added for running local backend .mjs scripts to streamline internal workflows.',
        ],
      },
    ],
  },
  {
    id: '1.6.40',
    heading: 'Version 1.6.40',
    release: 'Released: 05/01/2026',
    accentColor: '#FF00DE',
    sections: [
      {
        title: '✨ New Features',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Added an in-app "Report Bug" button and modal on most pages so players and learners can submit feedback without leaving the site.',
          'Bug reports are protected by reCAPTCHA verification and sanitized before delivery, keeping the feedback loop clean and safe.',
          'Added a Support Contact panel so users always have a clear path to reach the team.',
          'Introduced an SPA loading shell (spa.html) to provide faster initial page loads and smoother fallback handling on non-prerendered routes.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'User-friendly toast notifications have been added across all major flows — Learning, Tower Defense V2, Problem Workspace, AI Problems, billing, profile, and auth — so failures and warnings are always explained in plain language instead of silently disappearing.',
          'Login buttons (local and OAuth) now show a loading indicator while sign-in is in progress, preventing double-clicks and giving clear visual feedback.',
          'Learning paths have been restructured to follow a consistent learn → tower → final format, making the progression feel more intentional and less confusing.',
          'Account deletion instructions were revised for clarity and accuracy to reduce confusion during the deletion process.',
          'Font loading strategy was optimized across the site for faster perceived performance on first paint.',
          'Streamlined component structure across multiple pages by removing unused animations and dead code paths, reducing bundle weight.',
        ],
      },
      {
        title: '🎮 Gameplay & Learning',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'Learning paths now serve language-specific content rather than generic fallbacks, so what you see in the problem editor actually matches the language you are practicing.',
          'Tower problems now correctly localize their code display text to match the active language, preventing mismatched snippets from appearing during tower placements.',
          'The Problem Workspace no longer refetches problem and score data unnecessarily when prop references change identity without the underlying values changing — sessions are now smoother and faster.',
          'Learning XP handling now normalizes the modal summary more reliably, so level-up and completion modals display correctly even in edge-case session states.',
        ],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Fixed a bug in learning problem localization where a failed code-block replacement would incorrectly substitute the entire description string instead of preserving the original match.',
          'Fixed malformed NUL/control-character delimiters in the localization template by replacing them with explicit \\u0000 escape sequences, preventing encoding issues across editors and CI.',
          'Fixed the bug-report API path in the fetch layer so submitting a report no longer creates or persists a guest session token for already-authenticated users.',
          'Java wrapper visibility timeout handling was improved to prevent stale execution states from blocking subsequent submissions.',
          'CI/CD automation was hardened: release workflow now requires an explicit PR body checkbox before generating the update page entry, preventing accidental entries on routine merges.',
        ],
      },
    ],
  },
  {
    id: '1.6.02',
    heading: 'Version 1.6.02',
    release: 'Released: 04/28/2026',
    accentColor: '#00FFFF',
    sections: [
      {
        title: '✨ New Features',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Added a native blog experience with improved mobile access.',
          'Created new blog post content with updated landing page support.',
          'Updated the site sitemap to better reflect new and updated pages.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Improved SEO on Leaderboards and landing pages with enhanced page metadata.',
          'Refined blog post counting so the displayed totals match the actual content.',
          'Updated tower requirements to better respect the player’s selected language.',
        ],
      },
      {
        title: '🎮 Gameplay',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'Tower availability is now correctly scoped to the player’s language.',
          'When a preferred language has no snippet, the game now uses the first compatible option.',
          'XP level and role handling now falls back more reliably if summary data is missing.',
        ],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Improved initial language selection based on the learning problem context.',
          'Fixed tower defense editor behavior when object requirements are not needed.',
        ],
      },
    ],
  },
  {
    id: '1.6.01',
    heading: 'Version 1.6.01',
    release: 'Released: 04/28/2026',
    accentColor: '#E04545',
    sections: [
      {
        title: '🔒 Security',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Improved reCAPTCHA integration to better protect protected flows.',
          'Updated reCAPTCHA Enterprise settings to align with the current experience.',
          'Refined logout behavior to complete sign-out more reliably.',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Updated the update-page generation to handle existing pull requests more smoothly.',
          'Polished related documentation for smoother setup and maintenance.',
        ],
      },
    ],
  },
  {
    id: '1.6.00',
    heading: 'Version 1.6.00 - MAJOR UPDATE',
    release: 'Released: 04/26/2026',
    accentColor: '#00FF8C',
    sections: [
      {
        title: '✨ Account & Progress Upgrades',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Guest-to-account signup migration was rebuilt to carry progress forward more reliably instead of dropping important state during registration retries or duplicate requests.',
          'Solved guest problems now transfer into permanent account progress more safely, including XP credit, learning-path completion, and cleaner migration bookkeeping after signup.',
          'Guest cleanup and retry handling were hardened so partially migrated sessions are much less likely to leave account state inconsistent.',
        ],
      },
      {
        title: '🧠 Execution Engine Overhaul',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Judge0 execution handling was significantly upgraded across JavaScript, Java, C++, and Python so more problem shapes now run correctly, including linked lists, trees, graphs, design problems, and edge-case outputs.',
          'Wrapper parity work fixed a large set of contract mismatches between problem metadata and actual runtime execution, reducing false negatives and broken submissions in the CODEGRIND catalog.',
          'Execution plans, testcase normalization, comparator rules, and parity-validation tooling were expanded to catch production mismatches before they reach learners.',
          'Judge0 warmup support was added so the platform can prewake code execution earlier and reduce cold-start friction when opening a workspace.',
        ],
      },
      {
        title: '📚 Learning & Practice Improvements',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'Learning-path progress transfer is more dependable, especially for guests moving into registered accounts after solving onboarding and path-specific problems.',
          'Practice flow reliability improved around reduced CODEGRIND problem sets, stricter execution contracts, and safer sync between problem content and runtime expectations.',
          'The learning and problem workspace now benefits from better execution readiness and smoother continuity between guest usage and full account progression.',
        ],
      },
      {
        title: '🌐 Site Discovery & SEO',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'The frontend gained a real SEO pass with prerender support for public pages, stronger metadata, expanded structured data, and a larger sitemap for better crawlability.',
          'New practice-guide landing pages were added for coding interview prep, language-specific practice, gamified practice, and beginner-friendly entry points.',
          'Routing and browser-only component behavior were tightened so prerendered pages, ads, storage reads, and session helpers behave more safely during static generation.',
        ],
      },
      {
        title: '🐛 Important Fixes & Release Hardening',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'Fixed guest registration edge cases where already-migrated sessions, repeated calls, or crafted client payloads could produce inconsistent transfer behavior.',
          'Resolved a broad set of wrapper bugs and testcase interpretation issues uncovered during the 1.6 production parity audit.',
          'Release verification and environment guardrails were tightened so deployment checks, contract sync, and production validation are easier to trust before shipping.',
        ],
      },
    ],
  },
  {
    id: '1.5.04',
    heading: 'Version 1.5.04',
    release: 'Released: 04/13/2026',
    accentColor: '#FFD700',
    sections: [
      {
        title: '🤖 AI & Tools',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'Updated the AI requests to match the latest token limit setting for better compatibility.',
          'Improved automated checks to ensure the correct token limit parameter is sent.',
        ],
      },
    ],
  },
  {
    id: '1.5.03',
    heading: 'Version 1.5.03',
    release: 'Released: 04/08/2026',
    accentColor: '#8B00FF',
    sections: [
      {
        title: '📚 Learning',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Blog generation now runs on a weekly cadence to keep content fresh',
          'Social preview text is validated to meet character limits for better sharing',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'LinkedIn posting now uses a webhook for more reliable publishing',
          'Blog content preserves paragraph breaks when enforcing social text limits',
          'Added image testing for blog posts to improve visual quality',
        ],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: ['Fixed issues that prevented some blog posts from generating correctly'],
      },
    ],
  },
  {
    id: '1.5.02',
    heading: 'Version 1.5.02',
    release: 'Released: 03/11/2026',
    accentColor: '#00FF8C',
    sections: [
      {
        title: '✨ New Features',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'CODEGRIND problem source added with slug-based problem resolution',
          'Interview challenge sets updated with improved fetching and scoring',
          'Multi-model AI support added, including a new submission analysis model',
          'Automated blog and update page generation workflows enabled',
          'Learning paths overhauled with interview-ready status and demo paths',
        ],
      },
      {
        title: '🎮 Gameplay',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'Tower defense rewards and deployable occupancy checks improved',
          'Cluster navigation UX refined for better challenge flow',
          'Solution bonus wiring adjusted for more predictable scoring',
        ],
      },
      {
        title: '🛠️ Improvements',
        color: '#E04545',
        markerColor: '#E04545',
        items: [
          'Footer version now syncs correctly with release tracking',
          'Dev environment tooling improved for local vs tunnel workflows',
          'Expanded test coverage across many UI components and engines',
        ],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Fixed null ID guard for CODEGRIND problem lookup and slug fallback',
          'Removed duplicate bulk scores route to prevent double registration',
        ],
      },
      {
        title: '🏗️ Infrastructure',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Server and workflow hardening including branch validation and pipeline fallbacks',
          'Dependency updates and environment configuration updates applied',
        ],
      },
    ],
  },
  {
    id: '1.5.01',
    heading: 'Version 1.5.01',
    release: 'Released: 03/10/2026',
    accentColor: '#FF00DE',
    sections: [
      {
        title: '🛠️ Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Updated deployment workflow and rotated an expired deployment secret for smoother releases',
          'Upgraded deployment action to a newer version to keep builds current',
          'CI checks now run on pull requests to the dev branch',
        ],
      },
      {
        title: '🎮 Gameplay',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          "Fixed board automation so draft PRs move to 'In progress' and non-draft PRs move to 'In review'",
          'Adjusted board column name casing to match actual board labels',
        ],
      },
      {
        title: '📚 Learning',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: ['Updated project board and workflow docs to reflect the new automation flow'],
      },
      {
        title: '🐛 Bug Fixes',
        color: '#E04545',
        markerColor: '#E04545',
        items: ['Resolved a deployment failure caused by an expired service principal secret'],
      },
    ],
  },
  {
    id: '1.5.00',
    heading: 'Version 1.5.0 - MAJOR UPDATE',
    release: 'Released: 01/30/2026 - The Refactoring',
    accentColor: '#00FF8C',
    sections: [
      {
        title: '🧱 Massive Codebase Refactor',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Rebuilt the Tower Defense core into a modular V2 engine with dedicated combat, wave, placement, and rendering systems',
          'Split large UI files into focused panels, hooks, and utilities for faster iteration and cleaner architecture',
          'Refactored the home experience into modular, animated sections with improved performance',
        ],
      },
      {
        title: '🎮 Tower Defense V2 Overhaul',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'New upgrade panel, deployables, terminal commands, and refined tutorial flow',
          'Expanded enemy, projectile, and tower systems with improved visuals and balance',
          'Challenge maps added for curated progression and structured practice',
          'Numerous bug fixes, performance optimizations, and quality-of-life improvements',
          'New mechanics with fine tuned difficulty and other settings for personalized and ultra custom experiences',
          'Revamped Demo experience with enhanced interactivity',
        ],
      },
      {
        title: '📚 Learning Paths Demo',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          'Introduced interactive Learning Paths with structured curriculum for guided skill progression',
          'Demo experience showcasing curated lessons and hands-on coding challenges',
          'Module-based learning with clear objectives and completion tracking',
        ],
      },
      {
        title: '⭐ XP & Progression System',
        color: '#FFD700',
        markerColor: '#FFD700',
        items: [
          'New XP system rewarding problem completion, streaks, and achievements',
          'Level progression with visual feedback and milestone rewards',
          'Enhanced profile stats showing XP gains and progression history',
        ],
      },
      {
        title: '🤖 AI, Chat, and Creator Tools',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'AI problem generation, snippet generation and chat rate-limit overhaul',
          'Chat UX upgrades, safe-area padding, and markdown rendering improvements',
          'New guardrails and utilities to protect prompt injection and improve reliability',
          'Enhanced AI chat capabilities with improved context handling and response accuracy',
          'AI assistant now knows what problem you are working on, errors from your terminal and other context without explicit input',
        ],
      },
      {
        title: '💳 Payments, Profiles, and Community',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Stripe subscriptions and cancellation flow with webhook handling',
          'Profile dashboard upgrades, achievements, and leaderboard refinements',
          'Blog feed + post pages and a new Discord join entry point',
        ],
      },
      {
        title: '🎮 Discord Community',
        color: '#5865F2',
        markerColor: '#5865F2',
        items: [
          'Official Discord server launched for the CodeGrind community',
          'In-app Discord integration with easy join flow',
          `Real time game integration with events, announcements, and updates`,
          'Community channels for help, feedback, and connecting with other learners',
          'AI assistant bot for answering questions and providing coding help',
        ],
      },
      {
        title: '🔊 Audio, Ads, and Visual Polish',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          'Expanded soundtrack and sound effects with improved audio controls',
          'Ad integrations across chat and game views with updated slot management',
          'New Giphy backgrounds and UI refinements',
        ],
      },
    ],
  },
  {
    id: '1.13.0',
    heading: 'Version 1.13.0',
    release: 'Released: 01/15/2026 - Major Backend Refactor & Security',
    accentColor: '#00FFFF',
    dividerAfter: true,
    sections: [
      {
        title: '🏗️ Major Backend Architecture Refactor',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'Modular Route System:',
            markerColor: '#00FF8C',
            items: [
              'Extracted all routes from monolithic server.js (~2,900 lines reduced)',
              'Organized routes: auth, profile, submissions, scores, admin, etc.',
              'Each route module now self-contained with clear responsibilities',
              'Improved code maintainability and reduced merge conflicts',
            ],
          },
          {
            title: 'Middleware Organization:',
            markerColor: '#00FF8C',
            items: [
              'Separated CORS, CSRF, session, logging, and security headers',
              'Dedicated middleware files for clear separation of concerns',
              'Enhanced logging middleware with production-ready filtering',
              'Centralized security header configuration',
            ],
          },
          {
            title: 'Service Layer Extraction:',
            markerColor: '#00FF8C',
            items: [
              'Judge0 execution logic moved to dedicated service files',
              'Authentication service with centralized auth flows',
              'User stats calculation extracted for reusability',
              'Email service for verification and notifications',
            ],
          },
          {
            title: 'Language Wrappers for Judge0:',
            markerColor: '#00FF8C',
            items: [
              'Created Python, JavaScript, Java, and C++ wrappers',
              'Standardized test case parsing and output handling',
              'Enhanced debugging with unified metadata structure',
              'Better error messages for language-specific issues',
            ],
          },
        ],
      },
      {
        title: '🔒 CSRF Protection Fixed & Enhanced',
        color: '#FF0080',
        markerColor: '#FF0080',
        items: [
          {
            title: 'Proper CSRF Implementation:',
            markerColor: '#00FF8C',
            items: [
              'Fixed token generation using session-based identifiers',
              'CSRF tokens now properly cleared on session changes',
              'Environment-variable based secret management',
              'Conditional exemption for specific safe routes',
            ],
          },
          {
            title: 'Frontend Integration:',
            markerColor: '#00FF8C',
            items: [
              'Automatic CSRF token fetching and header injection',
              'Token refresh on auth state changes',
              'Improved error handling for CSRF failures',
              'User-friendly messages for token expiration',
            ],
          },
          {
            title: 'Security Hardening:',
            markerColor: '#00FF8C',
            items: [
              'Protected all state-changing operations',
              'Prevents cross-site request forgery attacks',
              'Maintains security without impacting user experience',
            ],
          },
        ],
      },
      {
        title: '📧 Email Change System',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          {
            title: 'Secure Email Updates:',
            markerColor: '#00FF8C',
            items: [
              'Users can now change their email address safely',
              'Verification code sent to new email before change',
              'Old email remains active until verification complete',
              'Pending email displayed with banner notification',
            ],
          },
          {
            title: 'Cancellation Flow:',
            markerColor: '#00FF8C',
            items: [
              'Dedicated cancellation page for pending email changes',
              'Link sent to both old and new email addresses',
              'Prevents email hijacking scenarios',
              'Clear user feedback throughout the process',
            ],
          },
          {
            title: 'Google Account Handling:',
            markerColor: '#00FF8C',
            items: [
              'Google users can now set passwords for email login',
              'Enhanced profile modal with clear instructions',
              'Prevents account lockout from Google OAuth issues',
            ],
          },
        ],
      },
      {
        title: '🔐 Authentication Flow Improvements',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          {
            title: 'Account Lockout Prevention:',
            markerColor: '#00FFFF',
            items: [
              'Users can always recover access through email verification',
              'Google users can add password as backup auth method',
              'Email change system prevents losing access',
              'Clear account state indicators in profile dashboard',
            ],
          },
          {
            title: 'Session Management:',
            markerColor: '#00FFFF',
            items: [
              'Enhanced session tracking across auth state changes',
              'Proper cookie clearing on logout and email changes',
              'Email verification state persisted in localStorage',
              'Improved redirect handling post-authentication',
            ],
          },
          {
            title: 'User Experience:',
            markerColor: '#00FFFF',
            items: [
              'Simplified OAuth success flows (direct redirects)',
              'Better error messages for authentication failures',
              'Verification state properly resets when switching modes',
            ],
          },
        ],
      },
      {
        title: '🎮 Tower Defense Refactor Groundwork',
        color: '#8B00FF',
        markerColor: '#8B00FF',
        items: [
          {
            title: 'Documentation & Planning:',
            markerColor: '#00FF8C',
            items: [
              'Comprehensive 8-part refactor documentation created',
              'Architecture analysis of current system',
              'State management, mechanics, and visual system docs',
              'Backend integration and terminal system planning',
            ],
          },
          {
            title: 'Game Engine V2 (WIP):',
            markerColor: '#00FF8C',
            items: [
              'New game engine architecture with separated concerns',
              'Dedicated Renderer for canvas operations',
              'Enhanced entity system and wave generation',
              'Test components created for gradual migration',
            ],
          },
          {
            title: 'Route Organization:',
            markerColor: '#00FF8C',
            items: [
              'Tower Defense routes extracted to dedicated file',
              'Better rate limiting with database persistence',
              'Improved cleanup jobs for expired rate limits',
            ],
          },
        ],
      },
      {
        title: '🐛 Additional Fixes & Improvements',
        color: '#FF1493',
        markerColor: '#FF1493',
        items: [
          {
            title: 'Judge0 Service:',
            markerColor: '#00FF8C',
            items: [
              'Enhanced readiness checks and logging for VM management',
              'Improved parameter handling in language wrappers',
              'Better error handling for run code endpoint',
              'Standardized metadata variable naming',
            ],
          },
          {
            title: 'Code Quality:',
            markerColor: '#00FF8C',
            items: [
              'Removed unused SolutionGenerationService',
              'Extracted cookie sanitization to dedicated module',
              'Consolidated runtime configuration',
              'Improved file naming conventions for route files',
            ],
          },
          {
            title: 'UI/UX:',
            markerColor: '#00FF8C',
            items: [
              'Pending email banner component for profile changes',
              'Enhanced profile edit modal with clear sections',
              'Better form validation and error messages',
              'Improved leaderboard and page container responsiveness',
            ],
          },
        ],
      },
    ],
  },
  {
    id: '1.12.0',
    heading: 'Version 1.12.0',
    release: 'Released: 01/07/2026 - Logging Optimization & Performance',
    accentColor: '#FF00DE',
    sections: [
      {
        title: '💾 Production Logging Overhaul (~80-90% Cost Reduction)',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          {
            title: 'Backend Logger Optimization:',
            markerColor: '#00FF8C',
            items: [
              'Implemented intelligent production filtering - only logs critical events',
              'Preserves error stacks (DEBUG) for troubleshooting while skipping noise',
              'Whitelists important business events: auth, payments, submissions, VM/Judge0',
              'Reduces storage costs from $1.56/month to ~$0.15-0.30/month (no traffic)',
            ],
          },
          {
            title: 'Frontend Logger Optimization:',
            markerColor: '#00FF8C',
            items: [
              'Eliminates recursive logging explosion (60+ POST /api/logs per page)',
              'Only sends WARN, ERROR, and error stacks to backend',
              'Filters unimportant INFO logs in production',
              'Maintains full console logging in development mode',
            ],
          },
          {
            title: 'Session Management Cleanup:',
            markerColor: '#00FF8C',
            items: [
              'Changed session lookup logs from INFO to DEBUG level',
              'Eliminates spam from logs firing on every single request',
              'Still available in dev mode for debugging session issues',
            ],
          },
        ],
      },
      {
        title: '🐛 Reliability & Bug Fixes',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          {
            title: 'Submission Error Handling:',
            markerColor: '#00FF8C',
            items: [
              'Fixed bug where connection errors showed "Your code is incorrect"',
              'Now displays "Try again" and auto-retries on connection failures',
              'Improved progressive waiting messages during submission polling',
              'Enhanced Judge0 service initialization error handling',
            ],
          },
          {
            title: 'Memory Leak Prevention:',
            markerColor: '#00FF8C',
            items: [
              'Moved interval timer cleanup to finally blocks',
              'Ensures timers are always cleaned up even on errors',
              'Prevents long-term memory accumulation from uncleaned timers',
            ],
          },
          {
            title: 'Authentication UX:',
            markerColor: '#00FF8C',
            items: [
              'Fixed verification state not resetting when switching to login mode',
              'Improved user feedback for VM timeout scenarios',
            ],
          },
        ],
      },
    ],
  },
  {
    id: '1.11.0',
    heading: 'Version 1.11.0',
    release: 'Released: 01/06/2026 - AI Generation & Execution Improvements',
    accentColor: '#00FFFF',
    sections: [
      {
        title: '🤖 AI Problem Generation Overhaul',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'Iterative Example Generation:',
            markerColor: '#00FF8C',
            items: [
              'Implemented smart nested test case unwrapping for cleaner output',
              'Enhanced test case generation with better accuracy and formatting',
              'Refined AI prompts for more consistent and reliable problem generation',
            ],
          },
          {
            title: 'Multi-Parameter Handling:',
            markerColor: '#00FF8C',
            items: [
              'Dramatically improved parsing and formatting of problems with multiple parameters',
              'Enhanced array and complex data structure handling across all languages',
              'Better type inference and conversion for test cases',
            ],
          },
          {
            title: 'Solution Formatting:',
            markerColor: '#00FF8C',
            items: [
              'Fixed solution sanitization to prevent one-liner code generation',
              'Enhanced code formatting for better readability and proper indentation',
              'Improved display of solutions in the frontend editor',
            ],
          },
          {
            title: 'Input Sanitization:',
            markerColor: '#00FF8C',
            items: [
              'Enhanced backend sanitization for HTML string handling',
              'Improved example data processing and validation',
              'Cleaned up payload handling by omitting unnecessary fields',
            ],
          },
        ],
      },
      {
        title: '🔧 Execution & Runtime Improvements',
        color: '#FF00DE',
        markerColor: '#FF00DE',
        items: [
          {
            title: 'Cache Management:',
            markerColor: '#00FF8C',
            items: [
              'Implemented intelligent cache management for temporary problems',
              'Enhanced language handling and storage efficiency',
              'Improved problem state persistence across sessions',
            ],
          },
          {
            title: 'Enhanced ListNode Support:',
            markerColor: '#00FF8C',
            items: [
              'Significantly improved linked list handling and conversion',
              'Better array-to-ListNode and ListNode-to-array transformations',
              'Enhanced debugging output for list-based problems',
            ],
          },
          {
            title: 'Polling Mechanism:',
            markerColor: '#00FF8C',
            items: [
              'Improved execution result polling for better reliability',
              'Enhanced timeout handling and error recovery',
              'Better status tracking for long-running submissions',
            ],
          },
        ],
      },
      {
        title: '🎯 Code Editor Enhancements',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          {
            title: 'State Management:',
            markerColor: '#00FF8C',
            items: [
              'Implemented automatic code editor state reset on problem change',
              'Fixed editor persistence issues when switching between problems',
              'Improved state synchronization across the application',
            ],
          },
          {
            title: 'Debugging & Logging:',
            markerColor: '#00FF8C',
            items: [
              'Enhanced debugging logs for AI problem execution',
              'Better error messages and troubleshooting information',
              'Improved visibility into code execution flow',
            ],
          },
        ],
      },
      {
        title: '🛠️ Infrastructure & Configuration',
        color: '#00FFFF',
        markerColor: '#00FFFF',
        items: [
          'Updated nodemailer to version 7.0.12 for improved email reliability',
          'Enhanced Vite configuration to allow access from custom domains and localhost',
          'Updated frontend dependencies including eslint, axios, and form-data',
          'Added comprehensive troubleshooting guide for local development with custom domains',
        ],
      },
      {
        title: '📝 Developer Documentation',
        color: '#00FF8C',
        markerColor: '#00FF8C',
        items: [
          'Added detailed documentation for local development setup',
          'Enhanced README with Azure OpenAI integration details',
          'Improved environment variable configuration instructions',
          'Better troubleshooting guidance for common issues',
        ],
      },
    ],
  },
];
