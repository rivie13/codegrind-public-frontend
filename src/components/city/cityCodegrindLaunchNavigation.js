export const resolveSameOriginNavigationTarget = (targetPath) => {
  if (typeof window === 'undefined' || typeof targetPath !== 'string') {
    return null;
  }

  const normalizedTargetPath = targetPath.trim();
  if (!normalizedTargetPath) {
    return null;
  }

  try {
    const resolvedUrl = new URL(normalizedTargetPath, window.location.origin);

    if (resolvedUrl.origin !== window.location.origin) {
      return null;
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return null;
  }
};

export const resolveLaunchNavigationInstruction = ({
  sameOriginTargetPath,
  targetLaunchRequest: _targetLaunchRequest,
  targetPath,
}) => {
  if (sameOriginTargetPath) {
    return {
      mode: 'spa',
      target: sameOriginTargetPath,
    };
  }

  return {
    mode: 'hard',
    target: sameOriginTargetPath || targetPath,
  };
};
