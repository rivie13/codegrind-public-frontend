import {
  HUD_PADDING,
  INTERACTION_LABEL_KEY_STYLE,
  INTERACTION_LABEL_LAYOUT,
  INTERACTION_LABEL_TEXT_STYLE,
  INTERACTION_LABEL_TITLE_STYLE,
  getInteractionLabelViewportScale,
} from '../apartmentPreviewScene.constants';

export const attachInteractionLabelMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    createInteractionLabel() {
      this.interactionLabelShadow = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.18);
      this.interactionLabelBackground = this.add
        .rectangle(0, 0, 10, 10, 0xd4d0c8, 1)
        .setStrokeStyle(1, 0x6f6f6f, 1);
      this.interactionLabelHighlightTop = this.add.rectangle(0, 0, 10, 1, 0xffffff, 0.92);
      this.interactionLabelHighlightLeft = this.add.rectangle(0, 0, 1, 10, 0xffffff, 0.92);
      this.interactionLabelShadowBottom = this.add.rectangle(0, 0, 10, 1, 0x6a6a6a, 1);
      this.interactionLabelShadowRight = this.add.rectangle(0, 0, 1, 10, 0x6a6a6a, 1);
      this.interactionLabelAccent = this.add.rectangle(0, 0, 10, 10, 0x000080, 1);
      this.interactionLabelTitleText = this.add
        .text(0, 0, 'INTERACT', INTERACTION_LABEL_TITLE_STYLE)
        .setOrigin(0, 0.5);
      this.interactionLabelKeycap = this.add
        .rectangle(0, 0, 10, 10, 0xd4d0c8, 1)
        .setStrokeStyle(1, 0x7b7b7b, 1);
      this.interactionLabelKeyText = this.add
        .text(0, 0, 'E', INTERACTION_LABEL_KEY_STYLE)
        .setOrigin(0.5);
      this.interactionLabelText = this.add
        .text(0, 0, 'Press to interact', INTERACTION_LABEL_TEXT_STYLE)
        .setOrigin(0, 0.5);
      this.interactionLabel = this.add
        .container(0, 0, [
          this.interactionLabelShadow,
          this.interactionLabelBackground,
          this.interactionLabelHighlightTop,
          this.interactionLabelHighlightLeft,
          this.interactionLabelShadowBottom,
          this.interactionLabelShadowRight,
          this.interactionLabelAccent,
          this.interactionLabelTitleText,
          this.interactionLabelKeycap,
          this.interactionLabelKeyText,
          this.interactionLabelText,
        ])
        .setDepth(10001)
        .setVisible(false);

      this.layoutInteractionLabel();
    },

    layoutInteractionLabel() {
      const keyWidth = Math.max(
        this.interactionLabelKeyText.width + INTERACTION_LABEL_LAYOUT.keyPaddingX * 2,
        INTERACTION_LABEL_LAYOUT.minKeyWidth
      );
      const keyHeight = Math.max(
        this.interactionLabelKeyText.height + INTERACTION_LABEL_LAYOUT.keyPaddingY * 2,
        INTERACTION_LABEL_LAYOUT.minKeyHeight
      );
      const bodyHeight =
        Math.max(keyHeight, this.interactionLabelText.height) +
        INTERACTION_LABEL_LAYOUT.paddingY * 2;
      const totalHeight =
        bodyHeight +
        INTERACTION_LABEL_LAYOUT.titleBarHeight +
        INTERACTION_LABEL_LAYOUT.borderInset * 2;
      const totalWidth =
        INTERACTION_LABEL_LAYOUT.paddingX * 2 +
        keyWidth +
        INTERACTION_LABEL_LAYOUT.gap +
        this.interactionLabelText.width;
      const leftEdge = -totalWidth / 2;
      const keyCenterX = leftEdge + INTERACTION_LABEL_LAYOUT.paddingX + keyWidth / 2;
      const textLeftX = keyCenterX + keyWidth / 2 + INTERACTION_LABEL_LAYOUT.gap;
      const titleCenterY =
        -totalHeight / 2 +
        INTERACTION_LABEL_LAYOUT.borderInset +
        INTERACTION_LABEL_LAYOUT.titleBarHeight / 2;
      const bodyCenterY =
        -totalHeight / 2 +
        INTERACTION_LABEL_LAYOUT.borderInset +
        INTERACTION_LABEL_LAYOUT.titleBarHeight +
        bodyHeight / 2;

      this.interactionLabelShadow.setSize(totalWidth, totalHeight).setPosition(2, 2);
      this.interactionLabelBackground.setSize(totalWidth, totalHeight);
      this.interactionLabelHighlightTop
        .setSize(Math.max(totalWidth - 2, 2), 1)
        .setPosition(0, -totalHeight / 2 + 1);
      this.interactionLabelHighlightLeft
        .setSize(1, Math.max(totalHeight - 2, 2))
        .setPosition(-totalWidth / 2 + 1, 0);
      this.interactionLabelShadowBottom.setSize(totalWidth, 1).setPosition(0, totalHeight / 2);
      this.interactionLabelShadowRight.setSize(1, totalHeight).setPosition(totalWidth / 2, 0);
      this.interactionLabelAccent
        .setSize(
          Math.max(totalWidth - INTERACTION_LABEL_LAYOUT.borderInset * 2 - 2, 2),
          INTERACTION_LABEL_LAYOUT.titleBarHeight
        )
        .setPosition(0, titleCenterY);
      this.interactionLabelTitleText.setPosition(
        -totalWidth / 2 +
          INTERACTION_LABEL_LAYOUT.borderInset +
          INTERACTION_LABEL_LAYOUT.titlePaddingX,
        titleCenterY
      );
      this.interactionLabelKeycap.setSize(keyWidth, keyHeight).setPosition(keyCenterX, bodyCenterY);
      this.interactionLabelKeyText.setPosition(keyCenterX, bodyCenterY);
      this.interactionLabelText.setPosition(textLeftX, bodyCenterY);
    },

    updateInteractionLabel() {
      if (this.getPreviewBridge().previewDeviceClass === 'phone') {
        this.interactionLabel.setVisible(false);
        return;
      }

      if (!this.activeInteractionZone || !this.player) {
        this.interactionLabel.setVisible(false);
        return;
      }

      const nextLabelText = this.getInteractionDetails(
        this.activeInteractionZone.object.name
      ).desktopPrompt;
      if (!nextLabelText) {
        this.interactionLabel.setVisible(false);
        return;
      }

      if (this.interactionLabelText.text !== nextLabelText) {
        this.interactionLabelText.setText(nextLabelText);
        this.layoutInteractionLabel();
      }

      this.interactionLabel.setVisible(true);

      const gameWidth = this.scale.gameSize?.width || this.scale.width || window.innerWidth;
      const gameHeight = this.scale.gameSize?.height || this.scale.height || window.innerHeight;
      const camera = this.cameras.main;
      const zoom = camera.zoom || 1;
      const viewportScale = getInteractionLabelViewportScale(gameWidth, gameHeight);
      const labelScale = viewportScale / zoom;
      const screenHalfHeight = (this.interactionLabelBackground.height * viewportScale) / 2;
      const bottomMargin = Math.max(HUD_PADDING * 3, gameHeight * 0.09, 40);
      const anchorPoint = camera.getWorldPoint(
        gameWidth / 2,
        gameHeight - bottomMargin - screenHalfHeight
      );

      this.interactionLabel.setScale(labelScale).setPosition(anchorPoint.x, anchorPoint.y);
    },

    setPrompt(nextPrompt) {
      if (this.activePrompt === nextPrompt) {
        return;
      }

      this.activePrompt = nextPrompt;
      this.updateHudLayout();
    },
  });
};
