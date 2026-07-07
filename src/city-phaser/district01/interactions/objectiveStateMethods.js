import {
  buildCompactObjectiveText,
  buildAmbientObjectiveHudState,
  buildRouteMissionObjective,
} from './interactionShared';
export const attachObjectiveStateMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    getRouteMissionObjective() {
      return buildRouteMissionObjective(this.getPreviewBridge());
    },

    buildObjectiveHudState() {
      if (!this.isIntroSequenceComplete) {
        return null;
      }

      const previewBridge = this.getPreviewBridge();

      if (this.activeSceneDialogue) {
        return {
          accentLabel: this.activeSceneDialogue.accentLabel || null,
          footer: this.activeSceneDialogue.footer || null,
          hotkey: null,
          iconSrc: this.getPreviewHudIconPath('warning'),
          mode: 'contact',
          nextActionLabel: 'Continue',
          placement: 'top-right',
          presentation: 'dialogue-overlay',
          statusLabel: this.activeSceneDialogue.statusLabel || null,
          text: this.activeSceneDialogue.text,
          title: this.activeSceneDialogue.title || 'District Contact',
          typingProfile: this.activeSceneDialogue.typingProfile || 'default',
        };
      }

      const postPathChoiceObjective = this.getPostPathChoiceObjective();

      if (postPathChoiceObjective) {
        const mappedTargetPointId =
          this.getMapPointConfig(postPathChoiceObjective.objective.targetPointId)?.id || null;

        if (previewBridge.postPathChoiceContactAcknowledged !== true) {
          return {
            accentLabel: postPathChoiceObjective.contact.accentLabel,
            footer: postPathChoiceObjective.objective.footer,
            hotkey: null,
            iconSrc: this.getPreviewHudIconPath('bell'),
            mode: 'contact',
            nextActionLabel: 'Continue',
            phoneObjectiveAccentLabel: 'Objective',
            phoneObjectiveStatusLabel: 'Objective',
            phoneObjectiveText: postPathChoiceObjective.objective.text,
            phoneObjectiveTitle: 'Current Objective',
            placement: 'top-right',
            presentation: 'dialogue-overlay',
            statusLabel: postPathChoiceObjective.contact.statusLabel,
            targetLabel: postPathChoiceObjective.objective.targetLabel,
            targetPointId: mappedTargetPointId,
            text: postPathChoiceObjective.contact.text,
            title: postPathChoiceObjective.contact.title,
            typingProfile: postPathChoiceObjective.contact.typingProfile,
          };
        }

        return {
          accentLabel: null,
          districtLocationLabel: this.getDistrictLocationHudLabel(),
          footer: postPathChoiceObjective.objective.footer,
          hotkey: 'WASD',
          iconSrc: this.getPreviewHudIconPath('bell'),
          mode: 'objective',
          phoneObjectiveAccentLabel: 'Objective',
          phoneObjectiveStatusLabel: 'Objective',
          phoneObjectiveText: postPathChoiceObjective.objective.text,
          phoneObjectiveTitle: 'Current Objective',
          placement: 'top-left',
          presentation: 'compact-objective',
          statusLabel: 'Objective',
          targetLabel: postPathChoiceObjective.objective.targetLabel,
          targetPointId: mappedTargetPointId,
          text: buildCompactObjectiveText(postPathChoiceObjective.objective.text),
          title: 'Current Objective',
          typewriterEnabled: false,
        };
      }

      const routeMissionObjective = this.getRouteMissionObjective();

      if (routeMissionObjective) {
        const mappedTargetPointId =
          this.getMapPointConfig(routeMissionObjective.targetPointId)?.id || null;

        return {
          accentLabel: null,
          districtLocationLabel: this.getDistrictLocationHudLabel(),
          footer: routeMissionObjective.footer,
          hotkey: null,
          iconSrc: this.getPreviewHudIconPath('bell'),
          mode: 'objective',
          phoneObjectiveAccentLabel: 'Objective',
          phoneObjectiveStatusLabel: 'Objective',
          phoneObjectiveText: routeMissionObjective.text,
          phoneObjectiveTitle: routeMissionObjective.title,
          placement: 'top-left',
          presentation: 'compact-objective',
          statusLabel: 'Objective',
          targetLabel: routeMissionObjective.targetLabel,
          targetPointId: mappedTargetPointId,
          text: buildCompactObjectiveText(routeMissionObjective.text),
          title: routeMissionObjective.title,
          typewriterEnabled: false,
        };
      }

      const ambientObjective = this.previewMapConfig?.ambientObjective || null;

      if (ambientObjective) {
        return buildAmbientObjectiveHudState(this, ambientObjective);
      }

      if (!this.terminalCueContainer?.visible) {
        return null;
      }

      const activeInteractionName = this.activeInteractionZone?.object?.name || null;
      const activeInteractionConfig = this.getInteractionConfig(activeInteractionName);
      const isPhonePreview = previewBridge.previewDeviceClass === 'phone';
      const isTerminalNearby =
        activeInteractionConfig?.kind === 'terminal' &&
        this.canUseInteraction(activeInteractionConfig);

      return {
        accentLabel: null,
        districtLocationLabel: this.getDistrictLocationHudLabel(),
        footer: isTerminalNearby
          ? isPhonePreview
            ? 'Tap Phone or rotate to portrait to pull up the field device. Tunnel unlocks there.'
            : 'Press E to interact with the terminal.'
          : isPhonePreview
            ? 'Use the movement pad to reach the safehouse terminal. The phone will ping when the signal is close.'
            : 'Use WASD or the Arrow Keys to move. Press E when you reach the terminal.',
        hotkey: isPhonePreview ? null : isTerminalNearby ? 'E' : 'WASD',
        iconSrc: this.getPreviewHudIconPath(isTerminalNearby ? 'terminal' : 'bell'),
        mode: 'objective',
        phoneObjectiveAccentLabel: 'Objective',
        phoneObjectiveStatusLabel: 'Objective',
        phoneObjectiveText: isTerminalNearby
          ? 'Use the safehouse terminal.'
          : 'Reach the safehouse terminal.',
        phoneObjectiveTitle: 'Current Objective',
        placement: 'top-left',
        presentation: 'compact-objective',
        statusLabel: 'Objective',
        targetPointId: this.getDefaultObjectivePointId(),
        text: buildCompactObjectiveText(
          isTerminalNearby ? 'Use the safehouse terminal.' : 'Reach the safehouse terminal.'
        ),
        title: 'Current Objective',
        typewriterEnabled: false,
      };
    },

    syncObjectiveHudState() {
      this.setPreviewHudState(this.buildObjectiveHudState());
    },

    buildPreviewWorldState() {
      const mapBounds = this.getMapBounds();
      const postPathChoiceObjective = this.getPostPathChoiceObjective();
      const routeMissionObjective = this.getRouteMissionObjective();
      const markers = this.getMapPointConfigs()
        .map((pointConfig) => this.resolveMapPoint(pointConfig))
        .filter(Boolean);
      const playerPosition = this.normalizeMapPosition(
        this.player?.x || 0,
        this.player?.y || 0,
        mapBounds
      );

      return {
        activeWaypointId: this.activeWaypointPointId || null,
        districtCollectibles: this.getCollectibleSummary(),
        locationId: this.previewLocationId,
        locationLabel: this.previewMapConfig?.label || null,
        mapHeight: mapBounds.height,
        mapWidth: mapBounds.width,
        markers,
        objectivePointId:
          this.getMapPointConfig(postPathChoiceObjective?.objective?.targetPointId)?.id ||
          this.getMapPointConfig(routeMissionObjective?.targetPointId)?.id ||
          this.getDefaultObjectivePointId(),
        player: playerPosition,
      };
    },

    syncPreviewWorldState(force = false) {
      const now = Number(this.time?.now || 0);

      if (!force && now < this.nextPreviewWorldStateSyncAt) {
        this.syncCollectibleDisplayVisibility();
        this.updateWaypointMarker();
        return;
      }

      this.nextPreviewWorldStateSyncAt = now + 140;
      this.syncCollectibleDisplayVisibility();
      this.setPreviewWorldState(this.buildPreviewWorldState());
      this.updateWaypointMarker();
    },
  });
};
