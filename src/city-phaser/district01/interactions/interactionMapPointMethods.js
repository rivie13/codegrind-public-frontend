import {
  getDistrict01PreviewInteractionAccess,
  getDistrict01PreviewMapPoints,
} from '../district01PreviewMaps';

import { findObject } from '../apartmentPreviewScene.utils';

import { resolveRouteSurfaceTargetPath } from './interactionShared';
export const attachInteractionMapPointMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    getMapPointConfigs() {
      return getDistrict01PreviewMapPoints(this.previewLocationId);
    },

    getMapPointConfig(pointId) {
      if (typeof pointId !== 'string' || !pointId.trim()) {
        return null;
      }

      return this.getMapPointConfigs().find((pointConfig) => pointConfig.id === pointId) || null;
    },

    getInteractionAccess(interactionConfig) {
      return getDistrict01PreviewInteractionAccess({
        apartmentEntryState: this.getPreviewBridge().apartmentEntryState,
        guestPhoneContext: this.getPreviewBridge().guestPhoneContext,
        interaction: interactionConfig,
      });
    },

    canUseInteraction(interactionConfig) {
      return this.getInteractionAccess(interactionConfig).allowed;
    },

    shouldHideInteractionWhenUnavailable(interactionConfig) {
      return !this.canUseInteraction(interactionConfig) && interactionConfig?.hideWhenUnavailable;
    },

    notifyBlockedInteraction(interactionAccess, interactionConfig, interactionName) {
      if (interactionAccess?.reason !== 'guest-trial') {
        return;
      }

      const previewBridge = this.getPreviewBridge();

      previewBridge.onBlockedInteraction?.({
        interactionName,
        locationId: this.previewLocationId,
        routeSurface: interactionAccess.routeSurface || interactionConfig?.routeSurface || null,
        restrictionCode: interactionAccess.restrictionCode || null,
        selectedTrialLearningPath:
          previewBridge.guestPhoneContext?.selectedTrialLearningPath || null,
        selectedTrialTrack:
          interactionAccess.selectedTrialTrack ||
          previewBridge.guestPhoneContext?.selectedTrialTrack ||
          null,
      });
    },

    getDefaultObjectivePointId() {
      const defaultObjectivePointId = this.previewMapConfig?.defaultObjectivePointId || null;

      if (!defaultObjectivePointId) {
        return null;
      }

      const pointConfig = this.getMapPointConfig(defaultObjectivePointId);
      const interactionConfig = this.getInteractionConfig(pointConfig?.objectName);

      if (this.shouldHideInteractionWhenUnavailable(interactionConfig)) {
        return null;
      }

      return pointConfig?.id || defaultObjectivePointId;
    },

    getMapBounds() {
      const mapWidth = Number(
        this.tilemap?.widthInPixels ||
          Number(this.tilemap?.width || 0) * Number(this.tilemap?.tileWidth || 0) ||
          0
      );
      const mapHeight = Number(
        this.tilemap?.heightInPixels ||
          Number(this.tilemap?.height || 0) * Number(this.tilemap?.tileHeight || 0) ||
          0
      );

      return {
        height: mapHeight > 0 ? mapHeight : 448,
        width: mapWidth > 0 ? mapWidth : 640,
      };
    },

    normalizeMapPosition(x, y, mapBounds = this.getMapBounds()) {
      const safeWidth = Math.max(Number(mapBounds?.width || 0), 1);
      const safeHeight = Math.max(Number(mapBounds?.height || 0), 1);
      const resolvedX = Math.round(Number(x || 0));
      const resolvedY = Math.round(Number(y || 0));

      return {
        x: resolvedX,
        xPercent: Math.min(Math.max((resolvedX / safeWidth) * 100, 0), 100),
        y: resolvedY,
        yPercent: Math.min(Math.max((resolvedY / safeHeight) * 100, 0), 100),
      };
    },

    resolveMapPoint(pointConfig) {
      if (!pointConfig?.objectName || !pointConfig?.layerName) {
        return null;
      }

      const objectValue = findObject(
        this.getMapObjectLayer(pointConfig.layerName)?.objects,
        pointConfig.objectName
      );

      if (!objectValue) {
        return null;
      }

      const anchorPosition = this.getObjectAnchorPosition(objectValue, pointConfig.anchor);
      const normalizedPosition = this.normalizeMapPosition(anchorPosition.x, anchorPosition.y);

      return {
        id: pointConfig.id,
        kind: pointConfig.kind,
        label: pointConfig.label,
        shortLabel: pointConfig.shortLabel,
        targetPath:
          resolveRouteSurfaceTargetPath({
            guestPhoneContext: this.getPreviewBridge().guestPhoneContext,
            routeSurface: pointConfig.routeSurface,
          }) ||
          pointConfig.targetPath ||
          null,
        x: normalizedPosition.x,
        xPercent: normalizedPosition.xPercent,
        y: normalizedPosition.y,
        yPercent: normalizedPosition.yPercent,
      };
    },

    createWaypointMarker() {
      this.waypointGuideLine = this.add.graphics().setDepth(10001).setVisible(false);
      this.waypointGuideShadow = this.add.rectangle(-3, 1, 7, 7, 0x0d1420, 0.3);
      this.waypointGuideCore = this.add
        .rectangle(-3, 0, 7, 7, 0xd4d0c8, 0.96)
        .setStrokeStyle(1, 0x38516d, 0.98);
      this.waypointGuideArrow = this.add
        .triangle(4, 0, -1, 4, 7, 0, -1, -4, 0x9eb6cc, 0.94)
        .setStrokeStyle(1, 0x26364c, 0.98);
      this.waypointMarker = this.add
        .container(0, 0, [
          this.waypointGuideShadow,
          this.waypointGuideCore,
          this.waypointGuideArrow,
        ])
        .setDepth(10002)
        .setVisible(false);
    },

    hideWaypointMarker() {
      this.waypointGuideLine?.clear();
      this.waypointGuideLine?.setVisible(false);
      this.waypointMarker?.setVisible(false);
    },

    isRouteGuideEnabled() {
      return this.getPreviewBridge().getPhoneGameSettings?.()?.routeGuideEnabled !== false;
    },

    updateWaypointMarker() {
      const pointConfig = this.getMapPointConfig(this.activeWaypointPointId);
      const resolvedPoint = this.resolveMapPoint(pointConfig);

      if (
        !this.isRouteGuideEnabled() ||
        !resolvedPoint ||
        !this.player ||
        !this.waypointGuideLine ||
        !this.waypointMarker
      ) {
        this.hideWaypointMarker();
        return;
      }

      const startX = Number(this.player.x || 0);
      const startY = Number(this.player.y || 0) - 20;
      const endX = Number(resolvedPoint.x || 0);
      const endY = Number(resolvedPoint.y || 0) - 14;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < 32) {
        this.hideWaypointMarker();
        return;
      }

      const unitX = deltaX / distance;
      const unitY = deltaY / distance;
      const startOffset = 18;
      const endOffset = 26;
      const guideStartX = startX + unitX * startOffset;
      const guideStartY = startY + unitY * startOffset;
      const guideEndX = endX - unitX * endOffset;
      const guideEndY = endY - unitY * endOffset;
      const guideDistance = Math.hypot(guideEndX - guideStartX, guideEndY - guideStartY);
      const timePhase = (Number(this.time?.now || 0) / 150) % 18;

      this.waypointGuideLine.clear();
      this.waypointGuideLine.setVisible(true);
      this.waypointGuideLine.lineStyle(1, 0x71859a, 0.1);
      this.waypointGuideLine.beginPath();
      this.waypointGuideLine.moveTo(guideStartX, guideStartY);
      this.waypointGuideLine.lineTo(guideEndX, guideEndY);
      this.waypointGuideLine.strokePath();

      for (let traveled = timePhase; traveled < guideDistance; traveled += 20) {
        const dotX = guideStartX + unitX * traveled;
        const dotY = guideStartY + unitY * traveled;
        const alpha = Math.min(0.16 + traveled / Math.max(guideDistance, 1) / 3.3, 0.34);
        const dotSize = traveled + 20 >= guideDistance ? 4 : 3;
        const dotLeft = Math.round(dotX - dotSize / 2);
        const dotTop = Math.round(dotY - dotSize / 2);

        this.waypointGuideLine.fillStyle(0xc8d4e0, alpha);
        this.waypointGuideLine.fillRect(dotLeft, dotTop, dotSize, dotSize);
        this.waypointGuideLine.lineStyle(1, 0x324660, Math.min(alpha + 0.1, 0.28));
        this.waypointGuideLine.strokeRect(dotLeft, dotTop, dotSize, dotSize);
      }

      this.waypointMarker
        .setPosition(guideEndX, guideEndY)
        .setRotation(Math.atan2(unitY, unitX))
        .setVisible(true);
    },

    handlePreviewWaypointRequest(detail) {
      const nextPointId =
        typeof detail?.pointId === 'string' && detail.pointId.trim() ? detail.pointId.trim() : null;

      this.activeWaypointPointId = this.getMapPointConfig(nextPointId)?.id || null;
      this.updateWaypointMarker();
      this.syncPreviewWorldState(true);
      this.syncObjectiveHudState();
    },
  });
};
