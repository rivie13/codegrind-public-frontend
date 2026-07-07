export const resolveHandheldPhoneShellLayout = ({
  height,
  phoneArtHeight = 336,
  phoneArtWidth = 160,
  shouldRotateLandscapePhone,
  width,
}) => {
  const viewportWidth = Math.max(Number(width) || phoneArtWidth, 1);
  const viewportHeight = Math.max(Number(height) || phoneArtHeight, 1);

  if (shouldRotateLandscapePhone) {
    const scale = Math.max(viewportWidth / phoneArtHeight, viewportHeight / phoneArtWidth);
    const frameWidth = Math.ceil(phoneArtWidth * scale);
    const frameHeight = Math.ceil(phoneArtHeight * scale);

    return {
      frameHeight: `${frameHeight}px`,
      frameWidth: `${frameWidth}px`,
      shellHeight: `${frameWidth}px`,
      shellWidth: `${frameHeight}px`,
    };
  }

  const scale = Math.max(viewportWidth / phoneArtWidth, viewportHeight / phoneArtHeight);
  const frameWidth = Math.ceil(phoneArtWidth * scale);
  const frameHeight = Math.ceil(phoneArtHeight * scale);

  return {
    frameHeight: `${frameHeight}px`,
    frameWidth: `${frameWidth}px`,
    shellHeight: `${frameHeight}px`,
    shellWidth: `${frameWidth}px`,
  };
};

export default resolveHandheldPhoneShellLayout;
