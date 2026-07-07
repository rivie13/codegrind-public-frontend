import { INTRO_BAR_RATIO } from '../apartmentPreviewScene.constants';

import {
  INTRO_LAYOUT_REQUIRED_KEYS,
  WINDOW_VIEW_OVERLAY_KEYS,
  LOADING_OVERLAY_KEYS,
  resolveLiveSceneNode,
  resolveLiveSceneNodes,
} from './overlayShared';
export const attachOverlayLayoutMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    layoutIntroOverlay() {
      const introLayoutNodes = resolveLiveSceneNodes(this, INTRO_LAYOUT_REQUIRED_KEYS);

      if (!introLayoutNodes) {
        return;
      }

      const introCityBackdrop = resolveLiveSceneNode(this, 'introCityBackdrop');
      const { introBackdropMatte, introCityTint, introLetterboxTop, introLetterboxBottom } =
        introLayoutNodes;

      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;
      const viewportCenterX = gameWidth / 2;
      const viewportCenterY = gameHeight / 2;
      const barHeight = Math.max(44, Math.round(gameHeight * INTRO_BAR_RATIO));

      introBackdropMatte.setPosition(viewportCenterX, viewportCenterY);
      introBackdropMatte.setSize(gameWidth, gameHeight);

      if (introCityBackdrop) {
        const cityFrame = introCityBackdrop.texture.getSourceImage();
        const scale = Math.min(gameWidth / cityFrame.width, gameHeight / cityFrame.height);

        introCityBackdrop.setPosition(viewportCenterX, viewportCenterY);
        introCityBackdrop.setDisplaySize(cityFrame.width * scale, cityFrame.height * scale);
      }

      introCityTint.setPosition(viewportCenterX, viewportCenterY);
      introCityTint.setSize(gameWidth, gameHeight);
      introLetterboxTop.setPosition(viewportCenterX, barHeight / 2);
      introLetterboxTop.setSize(gameWidth, barHeight);
      introLetterboxBottom.setPosition(viewportCenterX, gameHeight - barHeight / 2);
      introLetterboxBottom.setSize(gameWidth, barHeight);
    },

    layoutWindowViewOverlay() {
      const windowViewNodes = resolveLiveSceneNodes(this, WINDOW_VIEW_OVERLAY_KEYS, {
        resetArrayKey: 'windowViewOverlayNodes',
      });

      if (!windowViewNodes) {
        return;
      }

      const {
        windowViewHeaderShadow,
        windowViewHeaderBackground,
        windowViewHeaderTitleBar,
        windowViewHeaderTitle,
        windowViewHeaderBody,
        windowViewBackButtonShadow,
        windowViewBackButtonBackground,
        windowViewBackButtonText,
        windowViewBackButtonHitArea,
      } = windowViewNodes;

      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;
      const headerWidth = Math.min(Math.max(gameWidth * 0.58, 260), 440);
      const headerHeight = 56;
      const headerX = gameWidth / 2;
      const headerY = Math.max(24, Math.round(gameHeight * 0.05)) + headerHeight / 2;
      const buttonLabel =
        this.getPreviewBridge().previewDeviceClass === 'phone'
          ? 'Back to room'
          : 'Back to room [Esc]';

      if (windowViewBackButtonText.text !== buttonLabel) {
        windowViewBackButtonText.setText(buttonLabel);
      }

      const buttonWidth = Math.max(windowViewBackButtonText.width + 30, 138);
      const buttonHeight = 32;
      const buttonX = gameWidth / 2;
      const buttonY = gameHeight - Math.max(24, Math.round(gameHeight * 0.05)) - buttonHeight / 2;

      windowViewHeaderShadow.setPosition(headerX + 2, headerY + 2);
      windowViewHeaderShadow.setSize(headerWidth, headerHeight);
      windowViewHeaderBackground.setPosition(headerX, headerY);
      windowViewHeaderBackground.setSize(headerWidth, headerHeight);
      windowViewHeaderTitleBar.setPosition(headerX, headerY - headerHeight / 2 + 10);
      windowViewHeaderTitleBar.setSize(headerWidth - 10, 16);
      windowViewHeaderTitle.setPosition(headerX - headerWidth / 2 + 12, headerY - 18);
      windowViewHeaderBody.setWordWrapWidth(headerWidth - 24);
      windowViewHeaderBody.setPosition(headerX, headerY + 10);
      windowViewBackButtonShadow.setPosition(buttonX + 2, buttonY + 2);
      windowViewBackButtonShadow.setSize(buttonWidth, buttonHeight);
      windowViewBackButtonBackground.setPosition(buttonX, buttonY);
      windowViewBackButtonBackground.setSize(buttonWidth, buttonHeight);
      windowViewBackButtonText.setPosition(buttonX, buttonY);
      windowViewBackButtonHitArea.setPosition(buttonX, buttonY);
      windowViewBackButtonHitArea.setSize(buttonWidth, buttonHeight);
    },

    layoutLoadingOverlay() {
      const loadingOverlayNodes = resolveLiveSceneNodes(this, LOADING_OVERLAY_KEYS, {
        resetArrayKey: 'loadingOverlayNodes',
      });

      if (!loadingOverlayNodes) {
        return;
      }

      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;
      const windowWidth = Math.min(Math.max(gameWidth * 0.72, 360), 760);
      const windowHeight = Math.min(Math.max(gameHeight * 0.42, 240), 340);
      const centerX = gameWidth / 2;
      const centerY = gameHeight / 2;
      const titleBarHeight = Math.max(Math.round(windowHeight * 0.13), 24);
      const innerPadding = Math.max(Math.round(windowWidth * 0.06), 22);
      const progressWidth = windowWidth - innerPadding * 2;
      const progressHeight = 18;
      const resolvedProgress = Phaser.Math.Clamp(
        Number(this.loadingOverlayState?.progress ?? 0),
        0,
        1
      );
      const fillWidth = Math.max(progressWidth * resolvedProgress, resolvedProgress > 0 ? 6 : 0);

      loadingOverlayNodes.loadingOverlayBackdrop
        .setPosition(centerX, centerY)
        .setSize(gameWidth, gameHeight);
      loadingOverlayNodes.loadingOverlayGrid.clear();

      for (let x = 0; x <= gameWidth; x += 48) {
        loadingOverlayNodes.loadingOverlayGrid.lineBetween(x, 0, x, gameHeight);
      }

      for (let y = 0; y <= gameHeight; y += 48) {
        loadingOverlayNodes.loadingOverlayGrid.lineBetween(0, y, gameWidth, y);
      }

      loadingOverlayNodes.loadingOverlayShadow
        .setPosition(centerX + 10, centerY + 10)
        .setSize(windowWidth, windowHeight);
      loadingOverlayNodes.loadingOverlayWindow
        .setPosition(centerX, centerY)
        .setSize(windowWidth, windowHeight);
      loadingOverlayNodes.loadingOverlayTitleBar
        .setPosition(centerX, centerY - windowHeight / 2 + titleBarHeight / 2 + 4)
        .setSize(windowWidth - 8, titleBarHeight);
      loadingOverlayNodes.loadingOverlayKicker.setPosition(
        centerX - windowWidth / 2 + innerPadding,
        centerY - windowHeight / 2 + titleBarHeight / 2 + 4
      );
      loadingOverlayNodes.loadingOverlayLocation
        .setPosition(centerX, centerY - windowHeight * 0.12)
        .setFontSize(Math.max(Math.min(Math.round(windowWidth * 0.075), 52), 24));
      loadingOverlayNodes.loadingOverlayDetail
        .setPosition(centerX, centerY - windowHeight * 0.01)
        .setWordWrapWidth(windowWidth - innerPadding * 2);
      loadingOverlayNodes.loadingOverlayStatusDot.setPosition(
        centerX - progressWidth / 2,
        centerY + windowHeight * 0.16
      );
      loadingOverlayNodes.loadingOverlayStatusLabel.setPosition(
        centerX - progressWidth / 2 + 14,
        centerY + windowHeight * 0.16
      );
      loadingOverlayNodes.loadingOverlayProgressTrack
        .setPosition(centerX - progressWidth / 2, centerY + windowHeight * 0.28)
        .setSize(progressWidth, progressHeight);
      loadingOverlayNodes.loadingOverlayProgressFill
        .setVisible(fillWidth > 0)
        .setPosition(centerX - progressWidth / 2 + 2, centerY + windowHeight * 0.28)
        .setDisplaySize(Math.max(fillWidth - 4, 0), progressHeight - 4);
      loadingOverlayNodes.loadingOverlayFooter
        .setPosition(centerX, centerY + windowHeight * 0.36)
        .setWordWrapWidth(windowWidth - innerPadding * 2);

      this.loadingOverlayNodes = Object.values(loadingOverlayNodes);
    },
  });
};
