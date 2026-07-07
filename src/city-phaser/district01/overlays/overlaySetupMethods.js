import {
  INTRO_OVERLAY_DEPTH,
  RETRO_HUD_ICON_ASSETS,
  RETRO_WINDOW_BODY_STYLE,
  RETRO_WINDOW_META_STYLE,
  RETRO_WINDOW_TITLE_STYLE,
  TERMINAL_CUE_DEPTH,
  TERMINAL_CUE_WINDOW_HEIGHT,
  TERMINAL_CUE_WINDOW_WIDTH,
  WINDOW_VIEW_BODY_STYLE,
  WINDOW_VIEW_BUTTON_STYLE,
  WINDOW_VIEW_TITLE_STYLE,
} from '../apartmentPreviewScene.constants';

import { WINDOW_VIEW_OVERLAY_KEYS, resolveLiveSceneNode } from './overlayShared';
export const attachOverlaySetupMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    createTerminalCue() {
      if (!this.terminalZoneObject || this.terminalCueContainer) {
        return;
      }

      const cueFrame = this.add.graphics();
      cueFrame.fillStyle(0x000000, 0.24);
      cueFrame.fillRect(-70, -26, TERMINAL_CUE_WINDOW_WIDTH, TERMINAL_CUE_WINDOW_HEIGHT);
      cueFrame.fillStyle(0xd4d0c8, 1);
      cueFrame.fillRect(-74, -30, TERMINAL_CUE_WINDOW_WIDTH, TERMINAL_CUE_WINDOW_HEIGHT);
      cueFrame.fillStyle(0xffffff, 0.95);
      cueFrame.fillRect(-73, -29, TERMINAL_CUE_WINDOW_WIDTH - 2, 1);
      cueFrame.fillRect(-73, -29, 1, TERMINAL_CUE_WINDOW_HEIGHT - 2);
      cueFrame.fillStyle(0x686868, 1);
      cueFrame.fillRect(-74, 27, TERMINAL_CUE_WINDOW_WIDTH, 1);
      cueFrame.fillRect(73, -30, 1, TERMINAL_CUE_WINDOW_HEIGHT);
      cueFrame.fillStyle(0x000080, 1);
      cueFrame.fillRect(-70, -26, TERMINAL_CUE_WINDOW_WIDTH - 8, 14);
      cueFrame.fillStyle(0xd4d0c8, 1);
      cueFrame.fillRect(54, -24, 12, 10);
      cueFrame.fillStyle(0xffffff, 0.92);
      cueFrame.fillRect(55, -23, 10, 1);
      cueFrame.fillRect(55, -23, 1, 8);
      cueFrame.fillStyle(0x6a6a6a, 1);
      cueFrame.fillRect(55, -15, 10, 1);
      cueFrame.fillRect(65, -23, 1, 8);
      cueFrame.fillStyle(0x000080, 1);
      cueFrame.fillTriangle(-6, 28, 6, 28, 0, 36);

      this.terminalCueGlow = this.add.circle(-54, -4, 10, 0x67e8f9, 0.18);
      this.terminalCueBellIcon = this.add
        .image(-54, -18, RETRO_HUD_ICON_ASSETS.bell.key)
        .setDisplaySize(12, 12)
        .setTint(0xf5f7ff);
      this.terminalCueTitle = this.add
        .text(-45, -18, 'SIGNAL', RETRO_WINDOW_TITLE_STYLE)
        .setOrigin(0, 0.5);
      this.terminalCueBody = this.add
        .text(-60, 5, 'Safehouse terminal\nsignal live', RETRO_WINDOW_BODY_STYLE)
        .setOrigin(0, 0.5);
      this.terminalCueDeviceIcon = this.add
        .image(46, 5, RETRO_HUD_ICON_ASSETS.terminal.key)
        .setDisplaySize(18, 18)
        .setTint(0x232323);
      this.terminalCueBadge = this.add.rectangle(27, 18, 34, 12, 0x000080, 1);
      this.terminalCueBadgeLabel = this.add
        .text(27, 18, 'LIVE', RETRO_WINDOW_META_STYLE)
        .setOrigin(0.5);
      this.terminalCueContainer = this.add
        .container(0, 0, [
          cueFrame,
          this.terminalCueGlow,
          this.terminalCueBellIcon,
          this.terminalCueTitle,
          this.terminalCueBody,
          this.terminalCueDeviceIcon,
          this.terminalCueBadge,
          this.terminalCueBadgeLabel,
        ])
        .setDepth(TERMINAL_CUE_DEPTH)
        .setVisible(false)
        .setAlpha(0);

      if (this.fullscreenOverlayCamera) {
        this.fullscreenOverlayCamera.ignore(this.terminalCueContainer);
      }
    },

    createIntroOverlay() {
      this.introBackdropMatte = this.add
        .rectangle(0, 0, 10, 10, 0x020307, 1)
        .setDepth(INTRO_OVERLAY_DEPTH - 1)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.introCityBackdrop = this.duskCityFrames[0]?.key
        ? this.add
            .image(0, 0, this.duskCityFrames[0].key, this.duskCityFrames[0].frame ?? undefined)
            .setDepth(INTRO_OVERLAY_DEPTH)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setVisible(false)
            .setAlpha(0)
        : null;
      this.introCityTint = this.add
        .rectangle(0, 0, 10, 10, 0x03060d, 0.42)
        .setDepth(INTRO_OVERLAY_DEPTH + 1)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.introLetterboxTop = this.add
        .rectangle(0, 0, 10, 10, 0x020307, 1)
        .setDepth(INTRO_OVERLAY_DEPTH + 2)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.introLetterboxBottom = this.add
        .rectangle(0, 0, 10, 10, 0x020307, 1)
        .setDepth(INTRO_OVERLAY_DEPTH + 2)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);

      this.layoutIntroOverlay();
    },

    createWindowViewOverlay() {
      const overlayDepth = INTRO_OVERLAY_DEPTH + 4;

      this.windowViewHeaderShadow = this.add
        .rectangle(0, 0, 10, 10, 0x000000, 0.22)
        .setDepth(overlayDepth)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewHeaderBackground = this.add
        .rectangle(0, 0, 10, 10, 0xd4d0c8, 1)
        .setStrokeStyle(2, 0x6f6f6f, 1)
        .setDepth(overlayDepth)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewHeaderTitleBar = this.add
        .rectangle(0, 0, 10, 10, 0x000080, 1)
        .setDepth(overlayDepth + 1)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewHeaderTitle = this.add
        .text(0, 0, 'WINDOW VIEW', WINDOW_VIEW_TITLE_STYLE)
        .setDepth(overlayDepth + 2)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewHeaderBody = this.add
        .text(
          0,
          0,
          'Port Meridian after dark. Step back when you are ready to return.',
          WINDOW_VIEW_BODY_STYLE
        )
        .setDepth(overlayDepth + 2)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewBackButtonShadow = this.add
        .rectangle(0, 0, 10, 10, 0x000000, 0.22)
        .setDepth(overlayDepth)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewBackButtonBackground = this.add
        .rectangle(0, 0, 10, 10, 0xd4d0c8, 1)
        .setStrokeStyle(2, 0x6f6f6f, 1)
        .setDepth(overlayDepth + 1)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewBackButtonText = this.add
        .text(0, 0, 'Back to room', WINDOW_VIEW_BUTTON_STYLE)
        .setDepth(overlayDepth + 2)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0);
      this.windowViewBackButtonHitArea = this.add
        .rectangle(0, 0, 10, 10, 0x000000, 0.001)
        .setDepth(overlayDepth + 3)
        .setScrollFactor(0)
        .setVisible(false)
        .setAlpha(0)
        .setInteractive({ useHandCursor: true });
      this.windowViewBackButtonHitArea.on('pointerdown', () => {
        this.hideWindowView();
      });

      this.windowViewOverlayNodes = [
        this.windowViewHeaderShadow,
        this.windowViewHeaderBackground,
        this.windowViewHeaderTitleBar,
        this.windowViewHeaderTitle,
        this.windowViewHeaderBody,
        this.windowViewBackButtonShadow,
        this.windowViewBackButtonBackground,
        this.windowViewBackButtonText,
        this.windowViewBackButtonHitArea,
      ];

      this.events.once('shutdown', () => {
        this.windowViewBackButtonHitArea?.removeAllListeners();
      });

      this.layoutWindowViewOverlay();
    },

    configureFullscreenOverlayCamera() {
      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;

      if (!this.fullscreenOverlayCamera) {
        this.fullscreenOverlayCamera = this.cameras.add(
          0,
          0,
          gameWidth,
          gameHeight,
          false,
          'ApartmentPreviewOverlayCamera'
        );
        this.fullscreenOverlayCamera.clearBeforeRender = false;
      }

      this.fullscreenOverlayCamera.setViewport(0, 0, gameWidth, gameHeight);
      this.fullscreenOverlayCamera.setScroll(0, 0);
      this.fullscreenOverlayCamera.setZoom(1);
      this.fullscreenOverlayCamera.roundPixels = true;

      const liveWindowViewNodes = WINDOW_VIEW_OVERLAY_KEYS.map((key) =>
        resolveLiveSceneNode(this, key)
      ).filter(Boolean);
      const overlayNodes = [
        resolveLiveSceneNode(this, 'introBackdropMatte'),
        resolveLiveSceneNode(this, 'introCityBackdrop'),
        resolveLiveSceneNode(this, 'introCityTint'),
        resolveLiveSceneNode(this, 'introLetterboxTop'),
        resolveLiveSceneNode(this, 'introLetterboxBottom'),
        ...liveWindowViewNodes,
      ].filter(Boolean);

      this.windowViewOverlayNodes = liveWindowViewNodes;

      if (overlayNodes.length === 0) {
        return;
      }

      this.cameras.main.ignore(overlayNodes);
      this.fullscreenOverlayCamera.ignore(
        this.children.list.filter((node) => !overlayNodes.includes(node))
      );
      if (this.terminalCueContainer) {
        this.fullscreenOverlayCamera.ignore(this.terminalCueContainer);
      }
    },
  });
};
