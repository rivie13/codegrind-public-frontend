const BLOG_FEED_URL = 'https://rivie13.github.io/feed.xml';
const BLOG_BASE_URL = 'https://rivie13.github.io';
const CACHE_KEY = 'codegrind_blog_feed_v1';
const CACHE_TTL_MS = 15 * 60 * 1000;

const getText = (node, selector) => {
  const el = node.querySelector(selector);
  return el ? el.textContent?.trim() || '' : '';
};

const getAttribute = (node, selector, attr) => {
  const el = node.querySelector(selector);
  return el ? el.getAttribute(attr) || '' : '';
};

const parseHtmlText = (htmlString) => {
  if (!htmlString) return '';
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const normalizeInternalPath = (link) => {
  if (!link) return '';
  try {
    const url = new URL(link);
    const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    return path;
  } catch {
    return '';
  }
};

const parseFeed = (xmlText) => {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const entries = Array.from(doc.getElementsByTagName('entry'));

  return entries.map((entry) => {
    const title = getText(entry, 'title');
    const link = getAttribute(entry, 'link[rel="alternate"]', 'href') || getAttribute(entry, 'link', 'href');
    const published = getText(entry, 'published');
    const updated = getText(entry, 'updated');
    const summaryHtml = getText(entry, 'summary');
    const contentHtml = getText(entry, 'content');
    const categories = Array.from(entry.getElementsByTagName('category'))
      .map((category) => category.getAttribute('term'))
      .filter(Boolean);
    const thumbnail = entry.querySelector('media\\:thumbnail')?.getAttribute('url') || '';

    return {
      title,
      link,
      published,
      updated,
      summary: parseHtmlText(summaryHtml) || parseHtmlText(contentHtml).slice(0, 220),
      contentHtml,
      categories,
      thumbnail,
      internalPath: normalizeInternalPath(link)
    };
  });
};

const isFreshCache = (cached) => cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

export const fetchBlogFeed = async () => {
  if (typeof window !== 'undefined') {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (isFreshCache(cached)) {
          return cached.data;
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }

  const response = await fetch(BLOG_FEED_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load blog feed');
  }

  const xmlText = await response.text();
  const data = parseFeed(xmlText);

  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  }

  return data;
};

export const getBlogBaseUrl = () => BLOG_BASE_URL;
