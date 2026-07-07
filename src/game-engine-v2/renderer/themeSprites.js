function getRendererSpriteCache(renderer) {
  if (!renderer.spriteImageCache) {
    renderer.spriteImageCache = new Map();
  }

  return renderer.spriteImageCache;
}

function ensureRendererSpriteRecord(renderer, spriteSrc) {
  if (!spriteSrc) return null;

  const spriteCache = getRendererSpriteCache(renderer);
  let record = spriteCache.get(spriteSrc);

  if (!record) {
    record = createSpriteRecord(spriteSrc);
    spriteCache.set(spriteSrc, record);
  }

  return record;
}

function createSpriteRecord(spriteSrc) {
  const ImageCtor = typeof globalThis !== 'undefined' ? globalThis.Image : undefined;
  if (typeof ImageCtor !== 'function') {
    return { image: null, status: 'idle' };
  }

  const image = new ImageCtor();
  const record = { image, status: 'loading' };

  const markLoaded = () => {
    if (image.naturalWidth !== 0) {
      record.status = 'loaded';
    }
  };

  image.onload = markLoaded;

  image.onerror = () => {
    record.status = 'error';
  };

  if ('decoding' in image) {
    image.decoding = 'async';
  }

  if ('fetchPriority' in image) {
    image.fetchPriority = 'high';
  }

  image.src = spriteSrc;

  if (typeof image.decode === 'function') {
    record.decodePromise = image
      .decode()
      .then(markLoaded)
      .catch(() => {
        if (image.complete && image.naturalWidth !== 0) {
          record.status = 'loaded';
        }
      });
  }

  return record;
}

export function preloadRendererThemeSprites(renderer, settings = renderer?.settings) {
  if (!renderer || !settings) return [];

  const spriteSources = new Set();
  const addSpriteMap = (spriteMap) => {
    Object.values(spriteMap || {}).forEach((spriteSrc) => {
      if (typeof spriteSrc === 'string' && spriteSrc.trim()) {
        spriteSources.add(spriteSrc);
      }
    });
  };

  addSpriteMap(settings.towerPack?.towerSprites);
  addSpriteMap(settings.towerPack?.projectileSprites);
  addSpriteMap(settings.enemyPack?.enemySprites);

  spriteSources.forEach((spriteSrc) => {
    ensureRendererSpriteRecord(renderer, spriteSrc);
  });

  return Array.from(spriteSources);
}

export function normalizeThemeSpriteKey(value) {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function getThemeSprite(spriteMap, value) {
  if (!spriteMap) return null;

  const normalizedKey = normalizeThemeSpriteKey(value);
  return (
    spriteMap[normalizedKey] ||
    spriteMap[value] ||
    spriteMap[String(value || '').toLowerCase()] ||
    null
  );
}

export function getRendererSpriteImage(renderer, spriteSrc) {
  if (!spriteSrc) return null;

  const record = ensureRendererSpriteRecord(renderer, spriteSrc);

  if (!record?.image) {
    return null;
  }

  if (record.status === 'loaded') {
    return record.image;
  }

  if (record.image.complete && record.image.naturalWidth !== 0) {
    record.status = 'loaded';
    return record.image;
  }

  return null;
}

export function drawCenteredSpriteIcon(renderer, spriteSrc, centerX, centerY, size, options = {}) {
  const image = getRendererSpriteImage(renderer, spriteSrc);
  if (!image) return false;

  const width = options.width || size;
  const height = options.height || size;
  const alpha = options.alpha ?? 1;
  const shadowColor = options.shadowColor || null;
  const shadowBlur = options.shadowBlur || 0;
  const { ctx } = renderer;
  const previousSmoothing = ctx.imageSmoothingEnabled;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  if (shadowColor && shadowBlur > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
  }

  ctx.drawImage(image, centerX - width / 2, centerY - height / 2, width, height);
  ctx.imageSmoothingEnabled = previousSmoothing;
  ctx.restore();
  return true;
}
