import React from 'react';
import { Helmet } from 'react-helmet';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { PRERENDER_ROUTES } from './prerenderRoutes';

const renderHelmetStatic = (renderApp) => {
  const previousCanUseDOM = Helmet.canUseDOM;
  Helmet.canUseDOM = false;

  try {
    const html = renderApp();
    return {
      html,
      helmet: Helmet.renderStatic(),
    };
  } finally {
    Helmet.canUseDOM = previousCanUseDOM;
  }
};

const withDisabledDomGlobals = async (loadModule) => {
  const hadDocument = 'document' in globalThis;
  const hadWindow = 'window' in globalThis;
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;

  delete globalThis.document;
  delete globalThis.window;

  try {
    return await loadModule();
  } finally {
    if (hadDocument) {
      globalThis.document = previousDocument;
    }

    if (hadWindow) {
      globalThis.window = previousWindow;
    }
  }
};

const stripTitleTags = (titleMarkup = '') =>
  titleMarkup
    .replace(/<title[^>]*>/i, '')
    .replace(/<\/title>/i, '')
    .trim();

const normalizeHeadNodes = (nodes) => {
  const normalizedNodes = Array.isArray(nodes) ? nodes : nodes ? [nodes] : [];

  return normalizedNodes
    .filter((node) => React.isValidElement(node) && typeof node.type === 'string')
    .map((node) => {
      const props = Object.fromEntries(
        Object.entries(node.props || {}).flatMap(([key, value]) => {
          if (value == null || value === false) return [];
          if (key === 'children') {
            if (Array.isArray(value)) return [[key, value.join('')]];
            return [[key, String(value)]];
          }
          if (value === true) return [[key, '']];
          if (typeof value === 'string') return [[key, value]];
          if (typeof value === 'number') return [[key, String(value)]];
          return [[key, JSON.stringify(value)]];
        })
      );

      return {
        type: node.type,
        props,
      };
    });
};

const buildHead = (helmet, extraElements = []) => {
  const htmlAttributes = helmet.htmlAttributes?.toComponent?.() || {};

  return {
    lang: htmlAttributes.lang || 'en',
    title: stripTitleTags(helmet.title?.toString?.() || ''),
    elements: [
      ...extraElements,
      ...normalizeHeadNodes(helmet.meta?.toComponent?.()),
      ...normalizeHeadNodes(helmet.link?.toComponent?.()),
      ...normalizeHeadNodes(helmet.script?.toComponent?.()),
    ],
  };
};

const createEmotionStyleTag = (dataEmotion, css) =>
  `<style data-emotion="${dataEmotion}">${css}</style>`;

let emotionModulesPromise;
let publicAppPromise;
let parseLinksPromise;

const loadEmotionModules = () => {
  if (!emotionModulesPromise) {
    emotionModulesPromise = withDisabledDomGlobals(() =>
      Promise.all([
        import('../node_modules/@emotion/cache/dist/emotion-cache.esm.js'),
        import('../node_modules/@emotion/react/dist/emotion-react.esm.js'),
      ])
    );
  }

  return emotionModulesPromise;
};

const loadPublicApp = () => {
  if (!publicAppPromise) {
    publicAppPromise = withDisabledDomGlobals(async () => {
      const { default: PublicApp } = await import('./PublicApp');
      return PublicApp;
    });
  }

  return publicAppPromise;
};

const loadParseLinks = () => {
  if (!parseLinksPromise) {
    parseLinksPromise = import('vite-prerender-plugin/parse').then(({ parseLinks }) => parseLinks);
  }

  return parseLinksPromise;
};

export async function prerender({ url }) {
  const [{ default: createCache }, emotionReact] = await loadEmotionModules();
  const { CacheProvider } = emotionReact;
  const emotionCache = createCache({ key: 'css' });
  emotionCache.compat = true;
  const PublicApp = await loadPublicApp();

  const { html, helmet } = await withDisabledDomGlobals(async () => {
    return renderHelmetStatic(() =>
      renderToString(
        <CacheProvider value={emotionCache}>
          <StaticRouter location={url}>
            <PublicApp />
          </StaticRouter>
        </CacheProvider>
      )
    );
  });

  const renderedIds = new Set(
    [...html.matchAll(new RegExp(`${emotionCache.key}-([a-zA-Z0-9-_]+)`, 'gm'))].map(
      (match) => match[1]
    )
  );

  const regularIds = [];
  let regularCss = '';
  const emotionStyleElements = [];

  Object.entries(emotionCache.inserted).forEach(([id, css]) => {
    if (css === true || typeof css !== 'string' || css.length === 0) return;

    const cacheKey = `${emotionCache.key}-${id}`;
    const isGlobalStyle = emotionCache.registered[cacheKey] === undefined;
    if (!renderedIds.has(id) && !isGlobalStyle) return;

    if (isGlobalStyle) {
      emotionStyleElements.push(createEmotionStyleTag(`${emotionCache.key}-global ${id}`, css));
      return;
    }

    regularIds.push(id);
    regularCss += css;
  });

  if (regularCss.length > 0) {
    emotionStyleElements.push(
      createEmotionStyleTag(`${emotionCache.key} ${regularIds.join(' ')}`.trim(), regularCss)
    );
  }

  const parseLinks = await loadParseLinks();
  const links = parseLinks(html).filter((link) => PRERENDER_ROUTES.includes(link));

  return {
    html,
    links: new Set(links),
    head: buildHead(helmet, emotionStyleElements),
  };
}
