import { describe, expect, it } from 'vitest';
import { prerender } from './prerender';
import { getPrerenderRouteDetails } from './prerenderRoutes';

const PRERENDER_TIMEOUT_MS = 15000;
const FAQ_PRERENDER_TIMEOUT_MS = 30000;

const getHeadElement = (head, type, predicate) =>
  [...head.elements].find(
    (element) => typeof element === 'object' && element.type === type && predicate(element.props)
  );

describe('getPrerenderRouteDetails', () => {
  it('normalizes missing leading and trailing slashes', () => {
    expect(getPrerenderRouteDetails('faq/')).toMatchObject({
      path: '/faq',
      title: 'CodeGrind FAQ | Common Questions and Help',
    });

    expect(getPrerenderRouteDetails('/privacy-policy/')).toMatchObject({
      path: '/privacy-policy',
    });
  });

  it('returns metadata for SEO landing routes', () => {
    expect(getPrerenderRouteDetails('/coding-interview-practice/')).toMatchObject({
      path: '/coding-interview-practice',
      title: 'Coding Interview Practice Platform | CodeGrind',
      heading: 'Coding interview practice that feels less random and more deliberate.',
    });
  });

  it('returns metadata for native blog post routes', () => {
    expect(
      getPrerenderRouteDetails('/blog/codegrind/leetcode-burnout-different-way/')
    ).toMatchObject({
      path: '/blog/codegrind/leetcode-burnout-different-way',
      title: 'LeetCode Burnout: A Different Way to Keep Practicing | CodeGrind',
      heading: 'LeetCode Burnout: A Different Way to Keep Practicing',
    });
  });

  it('falls back to the homepage route for unknown paths', () => {
    expect(getPrerenderRouteDetails('/not-a-real-route')).toMatchObject({
      path: '/',
      title: 'CodeGrind | Coding Platform Featuring Code Breach and Interview Prep',
    });
  });
});

describe('prerender', () => {
  it(
    'returns FAQ html, links, and head metadata',
    async () => {
      const result = await prerender({ url: '/faq/' });

      expect(result.html).toContain('Need help fast?');
      expect(result.html.length).toBeGreaterThan(500);
      expect(result.links).toBeInstanceOf(Set);
      expect(result.links.has('/about')).toBe(true);
      expect(result.links.has('/updates')).toBe(true);
      expect(result.head).toMatchObject({
        lang: 'en',
        title: 'CodeGrind FAQ | Common Questions and Help',
      });

      expect(
        getHeadElement(
          result.head,
          'link',
          (props) => props.rel === 'canonical' && props.href === 'https://codegrind.online/faq'
        )
      ).toBeTruthy();
      expect(
        getHeadElement(
          result.head,
          'meta',
          (props) => props.name === 'description' && props.content.includes('common questions')
        )
      ).toBeTruthy();
    },
    FAQ_PRERENDER_TIMEOUT_MS
  );

  it(
    'returns updates html and social metadata for the updates route',
    async () => {
      const result = await prerender({ url: '/updates' });

      expect(result.html).toMatch(/Version History/i);
      expect(result.head).toMatchObject({
        title: 'CodeGrind Updates | Release Notes and Recent Changes',
      });
      expect(
        getHeadElement(
          result.head,
          'meta',
          (props) =>
            props.property === 'og:url' && props.content === 'https://codegrind.online/updates'
        )
      ).toBeTruthy();
      expect(
        getHeadElement(
          result.head,
          'meta',
          (props) => props.name === 'twitter:title' && props.content.includes('CodeGrind Updates')
        )
      ).toBeTruthy();
    },
    PRERENDER_TIMEOUT_MS
  );

  it(
    'returns SEO landing page html and head metadata for a prerendered landing route',
    async () => {
      const result = await prerender({ url: '/coding-interview-practice/' });

      expect(result.html).toContain(
        'Coding interview practice that feels less random and more deliberate.'
      );
      expect(result.html).toContain('Practice by pattern, not by panic');
      expect(result.head).toMatchObject({
        title: 'Coding Interview Practice Platform | CodeGrind',
      });
      expect(
        getHeadElement(
          result.head,
          'link',
          (props) =>
            props.rel === 'canonical' &&
            props.href === 'https://codegrind.online/coding-interview-practice'
        )
      ).toBeTruthy();
      expect(
        getHeadElement(
          result.head,
          'meta',
          (props) =>
            props.property === 'og:url' &&
            props.content === 'https://codegrind.online/coding-interview-practice'
        )
      ).toBeTruthy();
    },
    PRERENDER_TIMEOUT_MS
  );

  it('returns native blog post html and head metadata for a prerendered native blog route', async () => {
    const result = await prerender({
      url: '/blog/codegrind/leetcode-burnout-different-way',
    });

    expect(result.html).toContain('The most common interview prep story is the same every cycle');
    expect(result.html).toContain('CodeGrind Original');
    expect(result.head).toMatchObject({
      title: 'LeetCode Burnout: A Different Way to Keep Practicing | CodeGrind',
    });
    expect(
      getHeadElement(
        result.head,
        'link',
        (props) =>
          props.rel === 'canonical' &&
          props.href === 'https://codegrind.online/blog/codegrind/leetcode-burnout-different-way'
      )
    ).toBeTruthy();
    expect(
      getHeadElement(
        result.head,
        'meta',
        (props) =>
          props.property === 'og:url' &&
          props.content === 'https://codegrind.online/blog/codegrind/leetcode-burnout-different-way'
      )
    ).toBeTruthy();
  });
});
