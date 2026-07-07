import { Helmet } from 'react-helmet';

import { buildAbsoluteUrl, buildCanonicalUrl, SITE_LOGO_PATH, SITE_NAME } from './siteMetadata';

const buildImageUrl = (image) => {
  if (!image) return buildAbsoluteUrl(SITE_LOGO_PATH);
  return buildAbsoluteUrl(image);
};

function PageSeo({
  title = 'CodeGrind',
  description = 'CodeGrind is a coding platform for learning and interview prep featuring Code Breach, its first live tower defense coding game.',
  path = '/',
  image = '/logo.svg',
  keywords = '',
  robots = 'index,follow',
}) {
  const canonicalUrl = buildCanonicalUrl(path);
  const imageUrl = buildImageUrl(image);
  const fullTitle = title.includes('CodeGrind') ? title : `${title} | CodeGrind`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}

export default PageSeo;
