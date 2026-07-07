import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchBlogFeed, getBlogBaseUrl } from './blogService';

const FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <title>First Post</title>
    <link rel="alternate" href="https://rivie13.github.io/posts/first-post/" />
    <published>2026-01-01T00:00:00Z</published>
    <updated>2026-01-02T00:00:00Z</updated>
    <summary>&lt;p&gt;Hello &lt;strong&gt;world&lt;/strong&gt;&lt;/p&gt;</summary>
    <category term="frontend" />
    <category term="testing" />
    <media:thumbnail url="https://img.example/thumb.png" />
  </entry>
</feed>`;

describe('blogService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns fresh cached feed without fetching', async () => {
    const cached = [{ title: 'cached' }];
    localStorage.setItem(
      'codegrind_blog_feed_v1',
      JSON.stringify({ data: cached, timestamp: Date.now() })
    );

    const result = await fetchBlogFeed();

    expect(result).toEqual(cached);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('parses feed entries and stores cache after fetching', async () => {
    localStorage.setItem('codegrind_blog_feed_v1', '{bad json');
    global.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(FEED_XML),
    });

    const result = await fetchBlogFeed();

    expect(global.fetch).toHaveBeenCalledWith('https://rivie13.github.io/feed.xml', {
      cache: 'no-store',
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        title: 'First Post',
        link: 'https://rivie13.github.io/posts/first-post/',
        summary: 'Hello world',
        categories: ['frontend', 'testing'],
        thumbnail: '',
        internalPath: '/posts/first-post',
      })
    );

    const saved = JSON.parse(localStorage.getItem('codegrind_blog_feed_v1'));
    expect(saved.data[0].title).toBe('First Post');
    expect(typeof saved.timestamp).toBe('number');
  });

  it('throws when feed fetch fails', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      text: vi.fn(),
    });

    await expect(fetchBlogFeed()).rejects.toThrow('Failed to load blog feed');
  });

  it('returns configured blog base URL', () => {
    expect(getBlogBaseUrl()).toBe('https://rivie13.github.io');
  });
});
