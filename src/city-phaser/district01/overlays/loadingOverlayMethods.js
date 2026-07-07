import {
  RETRO_WINDOW_META_STYLE,
  RETRO_WINDOW_TITLE_STYLE,
} from '../apartmentPreviewScene.constants';

import {
  LOADING_OVERLAY_DEPTH,
  LOADING_OVERLAY_KEYS,
  LOADING_OVERLAY_TITLE_STYLE,
  LOADING_OVERLAY_DETAIL_STYLE,
  LOADING_OVERLAY_FOOTER_STYLE,
  resolveLiveSceneNodes,
} from './overlayShared';
export const attachLoadingOverlayMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    createLoadingOverlay() {
      this.loadingOverlayBackdrop = this.add
        .rectangle(0, 0, 10, 10, 0x6f86a1, 1)
        .setDepth(LOADING_OVERLAY_DEPTH)
        .setScrollFactor(0);
      this.loadingOverlayGrid = this.add.graphics().setDepth(LOADING_OVERLAY_DEPTH + 1);
      this.loadingOverlayGrid.setScrollFactor(0);
      this.loadingOverlayShadow = this.add
        .rectangle(0, 0, 10, 10, 0x000000, 0.22)
        .setDepth(LOADING_OVERLAY_DEPTH + 2)
        .setScrollFactor(0);
      this.loadingOverlayWindow = this.add
        .rectangle(0, 0, 10, 10, 0xd4d0c8, 1)
        .setStrokeStyle(2, 0x686868, 1)
        .setDepth(LOADING_OVERLAY_DEPTH + 3)
        .setScrollFactor(0);
      this.loadingOverlayTitleBar = this.add
        .rectangle(0, 0, 10, 10, 0x000080, 1)
        .setDepth(LOADING_OVERLAY_DEPTH + 4)
        .setScrollFactor(0);
      this.loadingOverlayKicker = this.add
        .text(0, 0, 'PORT MERIDIAN TRANSIT', RETRO_WINDOW_TITLE_STYLE)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      this.loadingOverlayLocation = this.add
        .text(0, 0, this.previewMapConfig?.label || 'District window', LOADING_OVERLAY_TITLE_STYLE)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.loadingOverlayDetail = this.add
        .text(0, 0, '', LOADING_OVERLAY_DETAIL_STYLE)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0.5, 0)
        .setAlign('center')
        .setScrollFactor(0);
      this.loadingOverlayStatusDot = this.add
        .circle(0, 0, 5, 0x22c7dc, 1)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setScrollFactor(0);
      this.loadingOverlayStatusLabel = this.add
        .text(0, 0, 'Route handoff', RETRO_WINDOW_META_STYLE)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      this.loadingOverlayProgressTrack = this.add
        .rectangle(0, 0, 10, 10, 0xf0ebf5, 1)
        .setStrokeStyle(2, 0x6f6f6f, 1)
        .setDepth(LOADING_OVERLAY_DEPTH + 4)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      this.loadingOverlayProgressFill = this.add
        .rectangle(0, 0, 10, 10, 0x3ecf8e, 1)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);
      this.loadingOverlayFooter = this.add
        .text(0, 0, '', LOADING_OVERLAY_FOOTER_STYLE)
        .setDepth(LOADING_OVERLAY_DEPTH + 5)
        .setOrigin(0.5, 0)
        .setAlign('center')
        .setScrollFactor(0);

      this.loadingOverlayNodes = LOADING_OVERLAY_KEYS.map((key) => this[key]).filter(Boolean);
      this.loadingOverlayPulseTween = this.tweens.add({
        alpha: { from: 0.42, to: 1 },
        duration: 760,
        repeat: -1,
        targets: this.loadingOverlayStatusDot,
        yoyo: true,
      });

      this.events.once('shutdown', () => {
        this.loadingOverlayPulseTween?.remove();
        this.loadingOverlayPulseTween = null;
      });

      this.setLoadingOverlayState({
        detail: 'Linking the next district route.',
        footer: 'Preparing the city handoff.',
        progress: 0.05,
        statusLabel: 'Route handoff',
        title: `Opening ${this.previewMapConfig?.label || 'district window'}`,
      });
    },

    setLoadingOverlayState(nextState = {}) {
      this.loadingOverlayState = {
        detail: nextState.detail || '',
        footer: nextState.footer || '',
        isError: Boolean(nextState.isError),
        kicker: nextState.kicker || 'PORT MERIDIAN TRANSIT',
        progress: Phaser.Math.Clamp(Number(nextState.progress ?? 0), 0, 1),
        statusLabel: nextState.statusLabel || 'Route handoff',
        title: nextState.title || `Opening ${this.previewMapConfig?.label || 'district window'}`,
      };

      const loadingOverlayNodes = resolveLiveSceneNodes(this, LOADING_OVERLAY_KEYS, {
        resetArrayKey: 'loadingOverlayNodes',
      });

      if (!loadingOverlayNodes) {
        return;
      }

      const titleBarColor = this.loadingOverlayState.isError ? 0x7a0f12 : 0x000080;
      const backdropColor = this.loadingOverlayState.isError ? 0x7a8a96 : 0x6f86a1;
      const gridColor = this.loadingOverlayState.isError ? 0x6d7c87 : 0x557191;
      const progressColor = this.loadingOverlayState.isError ? 0xd25454 : 0x3ecf8e;
      const statusColor = this.loadingOverlayState.isError ? '#ffd1d1' : '#f5f7ff';

      loadingOverlayNodes.loadingOverlayBackdrop.setFillStyle(backdropColor, 1);
      loadingOverlayNodes.loadingOverlayTitleBar.setFillStyle(titleBarColor, 1);
      loadingOverlayNodes.loadingOverlayStatusDot.setFillStyle(progressColor, 1);
      loadingOverlayNodes.loadingOverlayProgressFill.setFillStyle(progressColor, 1);
      loadingOverlayNodes.loadingOverlayKicker.setText(this.loadingOverlayState.kicker);
      loadingOverlayNodes.loadingOverlayLocation.setText(this.loadingOverlayState.title);
      loadingOverlayNodes.loadingOverlayDetail.setText(this.loadingOverlayState.detail);
      loadingOverlayNodes.loadingOverlayStatusLabel
        .setText(this.loadingOverlayState.statusLabel)
        .setColor(statusColor);
      loadingOverlayNodes.loadingOverlayFooter.setText(this.loadingOverlayState.footer);
      this.loadingOverlayGrid.lineStyle(1, gridColor, 0.32);

      this.loadingOverlayNodes.forEach((node) => {
        node.setVisible(true);
        if (typeof node.setAlpha === 'function') {
          node.setAlpha(1);
        }
      });

      this.layoutLoadingOverlay();
    },

    hideLoadingOverlay() {
      const loadingOverlayNodes = resolveLiveSceneNodes(this, LOADING_OVERLAY_KEYS, {
        resetArrayKey: 'loadingOverlayNodes',
      });

      if (!loadingOverlayNodes) {
        return;
      }

      const overlayTargets = Object.values(loadingOverlayNodes);

      this.tweens.killTweensOf(overlayTargets);
      this.tweens.add({
        alpha: 0,
        duration: 220,
        ease: 'Quad.Out',
        onComplete: () => {
          overlayTargets.forEach((target) => {
            target.setVisible(false);
          });
        },
        targets: overlayTargets,
      });
    },
  });
};
