import { Box } from '@chakra-ui/react';
import React from 'react';
import RetroDesktopBootScreen from '../city/RetroDesktopBootScreen';

const ROUTE_COPY = [
  {
    match: (pathname) => pathname === '/profile',
    label: 'Profile Console',
    windowTitle: 'profile.exe',
    description:
      'Opening your dashboard windows, account controls, progress widgets, and recent activity panes.',
    terminalRows: [
      'Mounting profile workspace shell',
      'Restoring account records and cosmetic state',
      'Resuming dashboard controls',
    ],
  },
  {
    match: (pathname) => /^\/profile\//.test(pathname),
    label: 'Profile Workspace',
    windowTitle: 'profile_workspace.exe',
    description:
      'Switching deeper into the profile workspace and restoring the selected account view.',
    terminalRows: [
      'Resolving profile route target',
      'Opening secondary profile window',
      'Restoring sub-page chrome',
    ],
  },
  {
    match: (pathname) => pathname === '/leaderboards',
    label: 'Leaderboard Console',
    windowTitle: 'leaderboards.exe',
    description: 'Opening ranked scoreboards, problem filters, and the current standings surface.',
    terminalRows: [
      'Routing into leaderboard workspace',
      'Restoring ranking tables',
      'Preparing filter controls',
    ],
  },
  {
    match: (pathname) => pathname === '/pricing',
    label: 'Plans and Pricing',
    windowTitle: 'pricing.exe',
    description: 'Loading the pricing desk, plan comparison cards, and membership details.',
    terminalRows: [
      'Opening pricing desk',
      'Restoring membership plan records',
      'Syncing billing presentation shell',
    ],
  },
  {
    match: (pathname) => pathname === '/about',
    label: 'About CodeGrind',
    windowTitle: 'about.exe',
    description:
      'Opening the project overview, platform story, and guest-facing information windows.',
    terminalRows: [
      'Opening information window',
      'Restoring public-facing content blocks',
      'Syncing document chrome',
    ],
  },
  {
    match: (pathname) => pathname === '/faq',
    label: 'FAQ',
    windowTitle: 'faq.exe',
    description:
      'Opening the help desk and restoring commonly asked questions for guests and members.',
    terminalRows: [
      'Opening help desk panel',
      'Indexing frequently asked entries',
      'Restoring reader controls',
    ],
  },
  {
    match: (pathname) => pathname === '/updates',
    label: 'Release Notes',
    windowTitle: 'updates.exe',
    description:
      'Opening the updates feed and loading the latest release notes and changelog entries.',
    terminalRows: [
      'Opening release notes window',
      'Restoring changelog records',
      'Syncing version history shell',
    ],
  },
  {
    match: (pathname) => pathname === '/blog',
    label: 'Blog',
    windowTitle: 'blog.exe',
    description:
      'Opening the blog desk and restoring current articles, cards, and reader controls.',
    terminalRows: ['Opening article desk', 'Restoring blog index', 'Preparing reader surface'],
  },
  {
    match: (pathname) => /^\/problems(\/|$)/.test(pathname),
    label: 'Problem Browser',
    windowTitle: 'problems.exe',
    description:
      'Opening the problem browser and restoring filters, categories, and solve records.',
    terminalRows: [
      'Opening problems browser',
      'Restoring catalog filters',
      'Syncing solve metadata',
    ],
  },
  {
    match: (pathname) => /^\/learning(\/|$)/.test(pathname),
    label: 'Learning Paths',
    windowTitle: 'learning_paths.exe',
    description:
      'Opening the learning-path workspace and restoring course progress and roadmap panels.',
    terminalRows: [
      'Opening learning workspace',
      'Restoring roadmap progress',
      'Preparing course panels',
    ],
  },
];

const getRouteCopy = (pathname) => {
  const matchedRoute = ROUTE_COPY.find((entry) => entry.match(pathname));

  if (matchedRoute) {
    return matchedRoute;
  }

  return {
    label: 'CodeGrind Window',
    windowTitle: 'codegrind.exe',
    description: 'Switching pages and restoring the next desktop window inside the main shell.',
    terminalRows: [
      'Resolving local route target',
      'Opening destination window',
      'Restoring shared chrome',
    ],
  };
};

function SiteRouteTransitionOverlay({ pathname, phase }) {
  const copy = getRouteCopy(pathname);
  const isEntering = phase === 'enter';

  return (
    <Box position="fixed" inset={0} zIndex={1900} pointerEvents="auto">
      <RetroDesktopBootScreen
        title={isEntering ? `Opening ${copy.label}...` : `Switching to ${copy.label}...`}
        description={copy.description}
        windowTitle={copy.windowTitle}
        statusLabel={isEntering ? 'window restore confirmed' : 'desktop route handoff in progress'}
        progressLabel={isEntering ? 'Window restore complete' : 'Route handoff progress'}
        terminalRows={copy.terminalRows}
        footerText={isEntering ? 'Desktop window restored.' : 'Preparing next desktop window...'}
        windowStatusLabel={isEntering ? 'ok' : 'run'}
        isProgressComplete={isEntering}
      />
    </Box>
  );
}

export default SiteRouteTransitionOverlay;
