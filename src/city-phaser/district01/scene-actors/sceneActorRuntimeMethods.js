import {
  SCENE_ACTOR_DEFAULT_SPEED,
  SCENE_ACTOR_PROGRESS_EPSILON,
  SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_WEIGHT,
} from './sceneActorShared';
export const attachSceneActorRuntimeMethods = (SceneClass, Phaser) => {
  Object.assign(SceneClass.prototype, {
    updateSceneActors() {
      const now = Number(this.time?.now || 0);

      (this.sceneActorEntries || []).forEach((entry) => {
        this.updateSceneActor(entry, now);
      });
    },

    completeSceneActorPendingResume(entry, pendingResume, now = 0) {
      entry.sprite.body.enable = true;
      entry.sprite.setPosition(pendingResume.position.x, pendingResume.position.y);
      entry.sprite.body.updateFromGameObject?.();
      entry.sprite.setVisible(true);
      entry.shadow?.setVisible(true);
      this.resetSceneActorRecovery(entry);

      if (typeof pendingResume.facing === 'string' && pendingResume.facing) {
        entry.facing = pendingResume.facing;
      }

      entry.currentRouteIndex = pendingResume.nextRouteIndex;
      entry.waitUntil = now + Number(pendingResume.waitMs ?? 0);
      entry.pendingResume = null;
      this.markSceneActorTargetProgress(entry, Number.POSITIVE_INFINITY, now);
      this.applySceneActorIdleAnimation(entry);
      this.syncSceneActorVisual(entry);
    },

    startSceneActorExitTransition(entry, pendingResume, now = 0) {
      entry.sprite.body.stop?.();
      entry.sprite.setVelocity?.(0, 0);
      entry.sprite.setPosition(pendingResume.position.x, pendingResume.position.y);
      entry.sprite.body.updateFromGameObject?.();
      entry.sprite.body.enable = false;
      entry.sprite.setVisible(false);
      entry.shadow?.setVisible(false);

      if (typeof pendingResume.facing === 'string' && pendingResume.facing) {
        entry.facing = pendingResume.facing;
      }

      const revealActor = () => {
        entry.sprite.body.enable = true;
        entry.sprite.body.updateFromGameObject?.();
        entry.sprite.setVisible(true);
        entry.shadow?.setVisible(true);
      };

      const startedDoorTransition = this.playDoorTransitionEffect(pendingResume.exitEffect, {
        actor: entry.sprite,
        enableActorBody: true,
        hideActorAfterMs: false,
        onShowActor: revealActor,
        shadow: entry.shadow,
        showActorAfterMs: pendingResume.showActorAfterMs,
      });

      if (!startedDoorTransition) {
        revealActor();
      }

      entry.pendingResume = {
        ...pendingResume,
        resumeAt: now + Number(pendingResume.exitEffect?.completeAfterMs ?? 720),
        stage: 'exiting',
      };
      this.syncSceneActorVisual(entry);
    },

    updateSceneActor(entry, now = 0) {
      const route = this.resolveSceneActorRoute(entry);

      if (!entry.sprite?.body) {
        return;
      }

      if (entry.pendingResume) {
        if (now < entry.pendingResume.resumeAt) {
          entry.sprite.setVelocity(0, 0);
          this.syncSceneActorVisual(entry);
          return;
        }

        if (entry.pendingResume.stage !== 'exiting' && entry.pendingResume.exitEffect) {
          this.startSceneActorExitTransition(entry, entry.pendingResume, now);
          return;
        }

        this.completeSceneActorPendingResume(entry, entry.pendingResume, now);
      }

      if (route.length === 0) {
        entry.sprite.setVelocity(0, 0);
        this.applySceneActorIdleAnimation(entry);
        this.syncSceneActorVisual(entry);
        return;
      }

      if (entry.waitUntil > now) {
        entry.sprite.setVelocity(0, 0);
        this.applySceneActorIdleAnimation(entry);
        this.syncSceneActorVisual(entry);
        return;
      }

      const routePoint = route[entry.currentRouteIndex] || null;
      const targetPosition = this.resolveSceneActorTargetPosition(routePoint);

      if (!routePoint || !targetPosition) {
        this.resetSceneActorRecovery(entry);
        entry.sprite.setVelocity(0, 0);
        this.applySceneActorIdleAnimation(entry);
        this.syncSceneActorVisual(entry);
        return;
      }

      const deltaX = targetPosition.x - entry.sprite.x;
      const deltaY = targetPosition.y - entry.sprite.y;
      const distance = Math.hypot(deltaX, deltaY);
      const arrivalDistance = Number(routePoint.arrivalDistance ?? 4);
      const routeChanged = entry.lastRouteIndex !== entry.currentRouteIndex;

      if (
        routeChanged ||
        distance <=
          Number(entry.lastProgressDistance ?? Number.POSITIVE_INFINITY) -
            SCENE_ACTOR_PROGRESS_EPSILON
      ) {
        if (routeChanged) {
          this.resetSceneActorRecovery(entry);
        }

        this.markSceneActorTargetProgress(entry, distance, now);
      }

      if (distance <= arrivalDistance) {
        const nextRouteIndex = this.resolveSceneActorRouteIndex(
          routePoint.nextRouteIndexChoices ?? routePoint.nextRouteIndex,
          (entry.currentRouteIndex + 1) % route.length
        );

        this.resetSceneActorRecovery(entry);
        entry.sprite.setVelocity(0, 0);

        if (typeof routePoint.facing === 'string' && routePoint.facing) {
          entry.facing = routePoint.facing;
        }

        this.applySceneActorIdleAnimation(entry);

        if (routePoint.navTraversedCrosswalkPairId && entry.navState) {
          entry.navState.blockedCrosswalkPairId = routePoint.navTraversedCrosswalkPairId;
        }

        if (routePoint.navNodeName) {
          entry.navState.currentNodeName = routePoint.navNodeName;
        }

        let plannedNavRoute = null;

        if (routePoint.navShouldPlanNextRoute) {
          if (routePoint.navClearsCrosswalkCooldown) {
            entry.navState.crosswalkCooldownActive = false;
            entry.navState.crosswalkFollowUpRule = null;
          }

          if (routePoint.navCrosswalkCooldownActiveOnArrival) {
            entry.navState.crosswalkCooldownActive = true;
            entry.navState.crosswalkFollowUpRule = routePoint.navCrosswalkFollowUpRule || null;
            if (routePoint.navShouldBlockCrosswalkPairOnArrival && routePoint.navCrosswalkPairId) {
              entry.navState.blockedCrosswalkPairId = routePoint.navCrosswalkPairId;
            }
          }

          entry.navState.lastDestinationNodeName = routePoint.navNodeName || null;
          plannedNavRoute = this.planSceneActorNavRoute(entry);
          entry.route = plannedNavRoute;
        }

        if (routePoint.transition) {
          const resumePosition =
            this.resolveSceneActorTargetPosition(routePoint.transition.resumeTarget) ||
            this.resolveSceneActorTargetPosition(entry.actorConfig.spawn) ||
            targetPosition;

          entry.pendingResume = {
            exitEffect: routePoint.transition.exitEffect || null,
            facing: routePoint.transition.resumeFacing || null,
            nextRouteIndex: routePoint.navShouldPlanNextRoute
              ? 0
              : this.resolveSceneActorRouteIndex(
                  routePoint.transition.nextRouteIndexChoices ??
                    routePoint.transition.nextRouteIndex,
                  nextRouteIndex
                ),
            position: resumePosition,
            resumeAt: now + this.resolveSceneActorTransitionHiddenDurationMs(routePoint.transition),
            showActorAfterMs: routePoint.transition.showActorAfterMs,
            stage: 'dwell',
            waitMs: routePoint.transition.resumeWaitMs ?? 0,
          };

          const hideActor = () => {
            entry.sprite.body.stop?.();
            entry.sprite.body.enable = false;
            entry.sprite.setVisible(false);
            entry.shadow?.setVisible(false);
          };

          const shouldHideActorImmediately = routePoint.transition.hideActorImmediately === true;

          if (shouldHideActorImmediately) {
            hideActor();
          } else {
            this.alignActorWithDoorTransition?.(routePoint.transition.effect, entry.sprite);
          }

          this.syncSceneActorVisual(entry);

          const startedDoorTransition = this.playDoorTransitionEffect(
            routePoint.transition.effect,
            {
              actor: entry.sprite,
              hideActorAfterMs: shouldHideActorImmediately
                ? false
                : routePoint.transition.effect?.hideActorAfterMs,
              onHideActor: shouldHideActorImmediately ? null : hideActor,
              shadow: entry.shadow,
            }
          );

          if (!startedDoorTransition && !shouldHideActorImmediately) {
            hideActor();
          }
        } else {
          entry.currentRouteIndex = routePoint.navShouldPlanNextRoute ? 0 : nextRouteIndex;
          entry.waitUntil = now + Number(routePoint.waitMs ?? 0);
          this.markSceneActorTargetProgress(entry, Number.POSITIVE_INFINITY, now);
        }

        this.syncSceneActorVisual(entry);
        return;
      }

      const directionVector = new Phaser.Math.Vector2(deltaX, deltaY).normalize();
      const speed = Number(
        routePoint.speed ?? entry.actorConfig.speed ?? SCENE_ACTOR_DEFAULT_SPEED
      );

      if (this.tryRecoverStuckSceneActor(entry, route, deltaX, deltaY, speed, now)) {
        return;
      }

      const avoidanceVector = this.resolveSceneActorAvoidanceVector(entry);

      if (avoidanceVector) {
        directionVector.x += avoidanceVector.x * SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_WEIGHT;
        directionVector.y += avoidanceVector.y * SCENE_ACTOR_NAV_LOCAL_AVOIDANCE_WEIGHT;

        if (directionVector.lengthSq() > 0) {
          directionVector.normalize();
        }
      }

      directionVector.scale(speed);
      entry.sprite.setVisible(true);
      entry.sprite.body.enable = true;
      entry.sprite.setVelocity(directionVector.x, directionVector.y);
      this.updateSceneActorAnimation(entry, directionVector);
      this.syncSceneActorVisual(entry);
    },

    updateSceneActorAnimation(entry, directionVector) {
      if (!directionVector || directionVector.lengthSq() === 0) {
        this.applySceneActorIdleAnimation(entry);
        return;
      }

      if (Math.abs(directionVector.x) >= Math.abs(directionVector.y)) {
        entry.facing = directionVector.x >= 0 ? 'right' : 'left';
      } else {
        entry.facing = directionVector.y >= 0 ? 'down' : 'up';
      }

      entry.sprite.setFlipX(entry.facing === 'left');
      entry.sprite.play(this.getSceneActorWalkAnimationKey(entry), true);
    },

    applySceneActorIdleAnimation(entry) {
      const animationKey = this.getSceneActorIdleAnimationKey(entry);

      entry.sprite.setFlipX(entry.facing === 'left');

      if (!animationKey) {
        return;
      }

      entry.sprite.play(animationKey, true);
    },

    getSceneActorIdleAnimationKey(entry) {
      const animationKeys = entry.animationKeys;

      if (!animationKeys) {
        return null;
      }

      if (entry.facing === 'up') return animationKeys.idleUp;
      if (entry.facing === 'left' || entry.facing === 'right') return animationKeys.idleSide;
      return animationKeys.idleDown;
    },

    getSceneActorWalkAnimationKey(entry) {
      const animationKeys = entry.animationKeys;

      if (!animationKeys) {
        return null;
      }

      if (entry.facing === 'up') return animationKeys.walkUp;
      if (entry.facing === 'left' || entry.facing === 'right') return animationKeys.walkSide;
      return animationKeys.walkDown;
    },
  });
};
