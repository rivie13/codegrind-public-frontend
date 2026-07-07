import { SEO_LANDING_PAGES } from './data/seoLandingPages';
import { getPublishedNativeBlogPosts } from './data/nativeBlogPosts';
import { normalizeSitePath } from './components/seo/siteMetadata';

const SEO_ROUTE_DETAILS = SEO_LANDING_PAGES.reduce((routes, page) => {
  routes[page.path] = {
    path: page.path,
    title: `${page.title} | CodeGrind`,
    heading: page.heroTitle,
    summary: page.intro,
    description: page.description,
    keywords: page.keywords,
  };
  return routes;
}, {});

const NATIVE_BLOG_ROUTE_DETAILS = getPublishedNativeBlogPosts().reduce((routes, post) => {
  const path = `/blog/codegrind/${post.slug}`;
  routes[path] = {
    path,
    title: `${post.title} | CodeGrind`,
    heading: post.title,
    summary: post.intro,
    description: post.description,
    keywords: post.keywords,
  };
  return routes;
}, {});

const ROUTE_DETAILS = {
  '/': {
    path: '/',
    title: 'CodeGrind | Coding Platform Featuring Code Breach and Interview Prep',
    heading: 'CodeGrind',
    summary:
      'CodeGrind is a coding platform where Code Breach leads the experience as the first live featured game, while learning paths and DSA practice build toward interview-ready problem solving.',
    description:
      'CodeGrind is a coding platform for learning and interview prep featuring Code Breach, its first live tower defense coding game, plus guided learning paths and DSA practice.',
    keywords:
      'codegrind, code breach, tower defense coding game, learn to code, coding interview prep, coding challenges, learning paths, programming practice',
  },
  '/about': {
    path: '/about',
    title: 'About CodeGrind | What the Platform Is Built For',
    heading: 'What CodeGrind Is Built For',
    summary:
      'CodeGrind is the platform, and Code Breach is its first live flagship game, connecting real coding problems to guided learning paths and interview prep.',
    description:
      'Learn what CodeGrind is, who it is for, and how the platform combines Code Breach, structured learning, and interview practice.',
    keywords:
      'about codegrind, code breach, tower defense coding game, coding interview platform, programming practice platform',
  },
  '/faq': {
    path: '/faq',
    title: 'CodeGrind FAQ | Common Questions and Help',
    heading: 'Frequently Asked Questions',
    summary:
      'Quick answers about how CodeGrind works, what the platform includes, and how to get started with practice and learning paths.',
    description:
      'Find answers to common questions about CodeGrind, including accounts, practice flow, learning paths, and platform access.',
    keywords: 'codegrind faq, coding platform help, interview prep faq',
  },
  '/privacy-policy': {
    path: '/privacy-policy',
    title: 'CodeGrind Privacy Policy | Data and Account Information',
    heading: 'Privacy and Data Use',
    summary:
      'Understand what CodeGrind stores, why it is stored, and how account, billing, guest, and community data are handled.',
    description:
      'Review the CodeGrind privacy policy covering account data, guest progress, billing metadata, and community integrations.',
    keywords: 'codegrind privacy policy, user data, account privacy',
  },
  '/updates': {
    path: '/updates',
    title: 'CodeGrind Updates | Release Notes and Recent Changes',
    heading: 'Recent Releases',
    summary:
      'Browse the latest CodeGrind updates, product improvements, and release notes for learning tools, gameplay, and platform changes.',
    description:
      'See recent CodeGrind release notes covering new features, improvements, and fixes across the platform.',
    keywords: 'codegrind updates, release notes, product changes',
  },
  ...SEO_ROUTE_DETAILS,
  ...NATIVE_BLOG_ROUTE_DETAILS,
};

export const PRERENDER_ROUTES = Object.keys(ROUTE_DETAILS);

export const getPrerenderRouteDetails = (path = '/') =>
  ROUTE_DETAILS[normalizeSitePath(path)] || ROUTE_DETAILS['/'];
