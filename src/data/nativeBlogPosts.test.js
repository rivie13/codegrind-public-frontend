import { afterEach, describe, expect, it, vi } from 'vitest';

const PROD_NATIVE_BLOG_BASE_URL =
  'https://codegrindpublicmedia.blob.core.windows.net/public-media/images/native_blogs';

const loadNativeBlogModule = async ({ assetBaseUrl = '', prod = false } = {}) => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('VITE_ASSET_BASE_URL', assetBaseUrl);
  vi.stubEnv('PROD', prod ? 'true' : '');

  return import('./nativeBlogPosts');
};

const getPostBySlug = (posts, slug) => posts.find((post) => post.slug === slug);

describe('nativeBlogPosts hero images', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses local public blog images in development', async () => {
    const { NATIVE_BLOG_POSTS, getNativeBlogHeroImage } = await loadNativeBlogModule({
      assetBaseUrl: '',
      prod: false,
    });

    expect(getNativeBlogHeroImage('tower-defense-teaches-dsa-patterns.jpg')).toBe(
      '/blog/tower-defense-teaches-dsa-patterns.jpg'
    );
    expect(getPostBySlug(NATIVE_BLOG_POSTS, 'why-codegrind-added-a-shop')?.heroImage).toBe(
      '/blog/Shop_NativeBlog_Image.png'
    );
  });

  it('uses the public media blob path in production', async () => {
    const { NATIVE_BLOG_POSTS, getNativeBlogHeroImage } = await loadNativeBlogModule({
      assetBaseUrl: '',
      prod: true,
    });

    expect(getNativeBlogHeroImage('tower-defense-teaches-dsa-patterns.jpg')).toBe(
      `${PROD_NATIVE_BLOG_BASE_URL}/tower-defense-teaches-dsa-patterns.jpg`
    );
    expect(
      getPostBySlug(NATIVE_BLOG_POSTS, 'city-map-walking-between-environments')?.heroImage
    ).toBe(`${PROD_NATIVE_BLOG_BASE_URL}/Walkable_City_NativeBlog_Image.png`);
  });
});
