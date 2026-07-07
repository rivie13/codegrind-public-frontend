export const getBackdropRect = (viewportWidth, viewportHeight, backdropSourceSize) => {
  const sourceWidth = Number(backdropSourceSize?.width || 0);
  const sourceHeight = Number(backdropSourceSize?.height || 0);

  if (viewportWidth <= 0 || viewportHeight <= 0 || sourceWidth <= 0 || sourceHeight <= 0) {
    return null;
  }

  const scale = Math.min(viewportWidth / sourceWidth, viewportHeight / sourceHeight);

  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    height,
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
  };
};

export const shouldRunBackdropSignClock = ({
  backdropRect,
  bootError = '',
  bootPhase = '',
  isCityVistaPresentationRequested = false,
}) =>
  bootPhase === 'ready' &&
  Boolean(backdropRect) &&
  !bootError &&
  Boolean(isCityVistaPresentationRequested);

const hasLoadedImage = (image) =>
  Boolean(
    image?.complete && Number(image?.naturalWidth || 0) > 0 && Number(image?.naturalHeight || 0) > 0
  );

const isJsdomWithoutDecode = () => {
  if (typeof window === 'undefined' || typeof window.Image !== 'function') {
    return false;
  }

  const probeImage = new window.Image();
  return (
    /jsdom/i.test(window.navigator?.userAgent || '') && typeof probeImage.decode !== 'function'
  );
};

export const preloadImageSource = (sourcePath) => {
  if (!sourcePath || typeof window === 'undefined' || typeof window.Image !== 'function') {
    return Promise.resolve(Boolean(sourcePath));
  }

  if (isJsdomWithoutDecode()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const image = new window.Image();
    let settled = false;

    const finish = (loaded) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(loaded);
    };

    const confirmDecoded = () => {
      if (typeof image.decode !== 'function') {
        finish(hasLoadedImage(image) || image.complete);
        return;
      }

      image.decode().then(
        () => finish(true),
        () => {
          // If decode() rejects (e.g., on mobile browsers under memory pressure),
          // we still treat the image as loaded since onload succeeded.
          finish(true);
        }
      );
    };

    image.onload = () => {
      confirmDecoded();
    };
    image.onerror = () => {
      finish(false);
    };
    image.src = sourcePath;

    if (hasLoadedImage(image)) {
      confirmDecoded();
    }
  });
};

export const preloadImageSources = async (sourcePaths) => {
  const uniqueSourcePaths = Array.from(new Set((sourcePaths || []).filter(Boolean)));

  if (uniqueSourcePaths.length === 0) {
    return true;
  }

  const results = await Promise.all(
    uniqueSourcePaths.map((sourcePath) => preloadImageSource(sourcePath))
  );
  return results.every(Boolean);
};
