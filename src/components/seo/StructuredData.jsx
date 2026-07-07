import { Helmet } from 'react-helmet';

import { buildAbsoluteUrl, SITE_LOGO_PATH, SITE_ORIGIN } from './siteMetadata';

const StructuredData = () => {
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CodeGrind',
    url: SITE_ORIGIN,
    logo: buildAbsoluteUrl(SITE_LOGO_PATH),
    sameAs: ['https://github.com/rivie13'],
  };

  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CodeGrind',
    url: `${SITE_ORIGIN}/`,
    description:
      'CodeGrind is a coding platform for learning and interview prep featuring Code Breach, its first live tower defense coding game, alongside learning paths, DSA practice, and AI-assisted feedback.',
    publisher: {
      '@type': 'Organization',
      name: 'CodeGrind',
      url: SITE_ORIGIN,
    },
    inLanguage: 'en-US',
  };

  const applicationData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CodeGrind',
    alternateName: 'CodeGrind by codegrind.online',
    url: SITE_ORIGIN,
    description:
      'A coding platform for learning and interview prep featuring Code Breach, the first live game on CodeGrind, where solving real coding problems clears waves while lessons, DSA practice, and AI verification build broader programming skill.',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Coding platform with educational games and interview practice',
    operatingSystem: 'Web',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    educationalUse: [
      'Practice',
      'Self-paced learning',
      'Programming education',
      'Interview preparation',
    ],
    audience: {
      '@type': 'Audience',
      audienceType:
        'Beginner programmers, self-taught developers, coding interview candidates, and developers practicing algorithms',
    },
    keywords:
      'codegrind, code breach, tower defense coding game, learn to code, coding interview practice, DSA practice, coding games, beginner coding practice, LeetCode alternative, programming challenges',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Code Breach, the first live featured game on CodeGrind',
      'Tower defense coding gameplay where correct solutions clear waves',
      'AI-powered coding assistant',
      'Beginner learning paths that build toward interview prep',
      'Original interview-style coding challenges',
      'Code Breach tower defense game',
      'Interactive learning experience',
      'Real-time code execution',
      'Gamified learning approach',
      'Public leaderboard',
      'AI generated questions',
    ],
  };

  const videoObjects = [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Code Breach Demo Trailer',
      description:
        'See Code Breach, the first live featured game on CodeGrind, turn real coding problems into a tower defense battle. Play free at https://codegrind.online/.',
      thumbnailUrl: buildAbsoluteUrl(SITE_LOGO_PATH),
      uploadDate: '2025-04-18',
      duration: 'PT0M56S',
      embedUrl: buildAbsoluteUrl('/videos/CODE_BREACH_DEMO_TRAILER.mp4'),
      contentUrl: buildAbsoluteUrl('/videos/CODE_BREACH_DEMO_TRAILER.mp4'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Code Breach Demo Trailer',
      description:
        'See Code Breach, the first live featured game on CodeGrind, turn real coding problems into a tower defense battle. Play free at https://codegrind.online/.',
      thumbnailUrl: buildAbsoluteUrl(SITE_LOGO_PATH),
      uploadDate: '2025-04-18',
      duration: 'PT0M47S',
      embedUrl: buildAbsoluteUrl('/videos/CODEBREACH_DEMO.mp4'),
      contentUrl: buildAbsoluteUrl('/videos/CODEBREACH_DEMO.mp4'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: 'Matrix Bomb Demo',
      description:
        'Watch a real coding problem enhanced by the Matrix Bomb effect in Code Breach, the flagship tower defense game on CodeGrind.',
      thumbnailUrl: buildAbsoluteUrl(SITE_LOGO_PATH),
      uploadDate: '2025-04-18',
      duration: 'PT0M22S',
      embedUrl: buildAbsoluteUrl('/videos/matrixBomb.mp4'),
      contentUrl: buildAbsoluteUrl('/videos/matrixBomb.mp4'),
    },
  ];

  return (
    <Helmet>
      {[organizationData, websiteData, applicationData].map((entry) => (
        <script key={entry['@type']} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
      {videoObjects.map((video, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(video)}
        </script>
      ))}
    </Helmet>
  );
};

export default StructuredData;
