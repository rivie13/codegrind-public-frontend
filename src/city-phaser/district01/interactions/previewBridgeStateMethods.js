import {
  APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT,
  APARTMENT_PREVIEW_HUD_STATE_EVENT,
  APARTMENT_PREVIEW_INPUT_TRACE_EVENT,
  APARTMENT_PREVIEW_INTERACTION_STATE_EVENT,
  APARTMENT_PREVIEW_WORLD_STATE_EVENT,
} from '../previewBootEvents';

import {
  buildPreviewInputTracePayload,
  getPreviewInputTraceNote,
} from '../apartmentPreviewScene.utils';

import { INTRO_SEQUENCE_STEPS } from '../apartmentPreviewScene.constants';

export const attachPreviewBridgeStateMethods = (SceneClass, _Phaser) => {
  Object.assign(SceneClass.prototype, {
    buildInteractionContext() {
      const interactionName = this.activeInteractionZone?.object?.name || null;
      const interactionDetails = this.getInteractionDetails(interactionName);
      const interactionConfig = this.getInteractionConfig(interactionName);
      const isTerminalZone =
        interactionConfig?.kind === 'terminal' && this.canUseInteraction(interactionConfig);
      const isWindowZone = interactionName === 'lookWindow';
      const touchControlsState = this.getPreviewBridge().touchControlsState || null;
      const activeTouchDirections = touchControlsState?.activeDirections || {};
      const sceneArrowRightActive = Boolean(this.cursorKeys?.right?.isDown);
      const sceneWasdRightActive = Boolean(this.wasdKeys?.right?.isDown);
      const sceneTouchRightActive = Boolean(activeTouchDirections.arrowright);
      const movementUnlocked =
        this.isSceneReady &&
        this.isIntroSequenceComplete &&
        !this.isIntroSequenceActive &&
        !this.controlsLocked;

      return {
        cityVistaPending:
          Boolean(this.hasPendingIntroSequenceStart) || Boolean(this.hasPendingWindowViewOpen),
        ...this.getCityBackdropPresentationState(),
        locationId: this.previewLocationId,
        locationLabel: this.previewMapConfig?.label || null,
        interactionName,
        inputDebug: {
          sceneArrowRightActive,
          sceneRightActive: sceneArrowRightActive || sceneWasdRightActive || sceneTouchRightActive,
          sceneTouchRightActive,
          sceneWasdRightActive,
        },
        isIntroSequenceActive: this.isIntroSequenceActive,
        isIntroSequenceComplete: this.isIntroSequenceComplete,
        movementUnlocked,
        mobileInteractionPrompt: interactionDetails.mobilePrompt || null,
        terminalZoneActive: isTerminalZone,
        terminalZoneName: isTerminalZone ? interactionName : null,
        windowViewActive: this.isWindowViewActive,
        windowViewBackdropSourceSize: this.getIntroCityBackdropSourceSize(),
        windowViewUsesUncroppedBackdrop: this.isUsingUncroppedCityBackdrop,
        windowZoneActive: isWindowZone,
      };
    },

    syncInteractionContext() {
      this.setPreviewInteractionState(this.buildInteractionContext());
    },

    setPreviewInputTrace(nextTrace) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APARTMENT_PREVIEW_INPUT_TRACE_EVENT, {
            detail: nextTrace ?? null,
          })
        );
      }
    },

    handlePreviewInputKeyDown(event) {
      this.setPreviewInputTrace(
        buildPreviewInputTracePayload({
          event,
          eventType: 'keydown',
          note: getPreviewInputTraceNote({ event, eventType: 'keydown' }),
        })
      );
    },

    handlePreviewInputKeyUp(event) {
      this.setPreviewInputTrace(
        buildPreviewInputTracePayload({
          event,
          eventType: 'keyup',
          note: getPreviewInputTraceNote({ event, eventType: 'keyup' }),
        })
      );
    },

    setPreviewHudState(nextState) {
      const shouldAttachCollectibleSummary =
        nextState?.presentation === 'compact-objective' ||
        (nextState?.mode === 'objective' && !nextState?.presentation);
      const collectibleSummaryText = shouldAttachCollectibleSummary
        ? this.getCollectibleSummaryText()
        : null;
      const resolvedState =
        collectibleSummaryText && nextState
          ? {
              ...nextState,
              collectibleSummaryText,
            }
          : nextState;
      const serializedState = JSON.stringify(resolvedState ?? null);
      if (this.previewHudStateSerialized === serializedState) {
        return;
      }
      this.previewHudStateSerialized = serializedState;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APARTMENT_PREVIEW_HUD_STATE_EVENT, {
            detail: resolvedState ?? null,
          })
        );
      }
    },

    setPreviewCollectibleModalState(nextState) {
      const serializedState = JSON.stringify(nextState ?? null);
      if (this.previewCollectibleModalSerialized === serializedState) {
        return;
      }

      this.previewCollectibleModalSerialized = serializedState;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APARTMENT_PREVIEW_COLLECTIBLE_MODAL_EVENT, {
            detail: nextState ?? null,
          })
        );
      }
    },

    setPreviewInteractionState(nextState) {
      const serializedState = JSON.stringify(nextState ?? null);
      if (this.previewInteractionStateSerialized === serializedState) {
        return;
      }

      this.previewInteractionStateSerialized = serializedState;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APARTMENT_PREVIEW_INTERACTION_STATE_EVENT, {
            detail: nextState ?? null,
          })
        );
      }
    },

    setPreviewWorldState(nextState) {
      const serializedState = JSON.stringify(nextState ?? null);
      if (this.previewWorldStateSerialized === serializedState) {
        return;
      }

      this.previewWorldStateSerialized = serializedState;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(APARTMENT_PREVIEW_WORLD_STATE_EVENT, {
            detail: nextState ?? null,
          })
        );
      }
    },

    forceSyncBridgeStates() {
      this.previewHudStateSerialized = '';
      this.previewCollectibleModalSerialized = '';
      this.previewInteractionStateSerialized = '';
      this.previewWorldStateSerialized = '';

      if (
        this.isIntroSequenceActive &&
        this.introBeatIndex >= 0 &&
        this.introBeatIndex < INTRO_SEQUENCE_STEPS.length
      ) {
        const beat = INTRO_SEQUENCE_STEPS[this.introBeatIndex];
        this.setPreviewHudState(this.buildIntroHudState(beat));
      } else {
        this.syncObjectiveHudState?.();
      }

      this.syncInteractionContext?.();
      this.syncPreviewWorldState?.(true);
    },
  });
};
