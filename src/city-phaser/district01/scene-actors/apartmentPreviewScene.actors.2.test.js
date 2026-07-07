import { describe, expect, it, vi } from 'vitest';

import {
  createShadow,
  createSprite,
  createPointObject,
  createScene,
} from './sceneActorTestHelpers';

describe('apartmentPreviewScene actors 2', () => {
  it('replays a door transition when an actor exits from a hidden dwell', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);
    const shadow = createShadow(20, 40);
    const playDoorTransitionEffect = vi.fn((effect, options) => {
      options.onShowActor?.();
      return true;
    });
    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 20,
              y: 40,
            },
            transition: {
              exitEffect: {
                appearance: {
                  animationKeyPrefix: 'city-preview-door:test-door',
                  frameCount: 4,
                  textureKey: 'city-preview-door:test-door:sheet',
                },
                completeAfterMs: 720,
              },
              hiddenDurationMs: 500,
              nextRouteIndex: 0,
              resumeFacing: 'down',
              resumeTarget: {
                x: 10,
                y: 12,
              },
              showActorAfterMs: 90,
            },
          },
        ],
        spawn: {
          x: 10,
          y: 12,
        },
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'down',
      pendingResume: null,
      shadow,
      sprite,
      waitUntil: 0,
    };

    scene.playDoorTransitionEffect = playDoorTransitionEffect;

    scene.updateSceneActor(entry, 0);

    expect(entry.pendingResume).toMatchObject({
      position: {
        x: 10,
        y: 12,
      },
      stage: 'dwell',
    });

    scene.updateSceneActor(entry, 600);

    expect(playDoorTransitionEffect).toHaveBeenCalledWith(
      entry.actorConfig.route[0].transition.exitEffect,
      expect.objectContaining({
        actor: sprite,
        hideActorAfterMs: false,
        shadow,
        showActorAfterMs: 90,
      })
    );
    expect(entry.pendingResume).toMatchObject({
      stage: 'exiting',
    });

    scene.updateSceneActor(entry, 1400);

    expect(entry.pendingResume).toBeNull();
    expect(entry.currentRouteIndex).toBe(0);
    expect(entry.sprite.visible).toBe(true);
  });

  it('can choose among multiple configured next route indexes', () => {
    const scene = createScene({ sceneActors: [] });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(scene.resolveSceneActorRouteIndex([1, 3, 5], 0)).toBe(5);

    randomSpy.mockRestore();
  });

  it('can choose among multiple configured transition resume indexes', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);
    const shadow = createShadow(20, 40);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 20,
              y: 40,
            },
            transition: {
              hiddenDurationMs: 500,
              nextRouteIndexChoices: [1, 3, 5],
              resumeTarget: {
                x: 10,
                y: 12,
              },
            },
          },
          { target: { x: 10, y: 12 } },
          { target: { x: 10, y: 12 } },
          { target: { x: 10, y: 12 } },
          { target: { x: 10, y: 12 } },
          { target: { x: 10, y: 12 } },
        ],
        spawn: {
          x: 10,
          y: 12,
        },
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'down',
      pendingResume: null,
      shadow,
      sprite,
      waitUntil: 0,
    };

    scene.updateSceneActor(entry, 0);

    expect(entry.pendingResume).toMatchObject({
      nextRouteIndex: 5,
    });

    randomSpy.mockRestore();
  });

  it('backs an actor straight away from a blocker before adding any sidestep correction', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(40, 40);
    const shadow = createShadow(40, 40);

    sprite.body.blocked.right = true;
    sprite.body.touching.right = true;

    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 84,
              y: 40,
            },
          },
        ],
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'right',
      lastProgressAt: 0,
      lastProgressDistance: 44,
      lastRouteIndex: 0,
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      shadow,
      sprite,
      stuckAttemptCount: 0,
      stuckRouteIndex: -1,
      waitUntil: 0,
    };

    scene.updateSceneActor(entry, 500);

    const [velocityX, velocityY] = sprite.setVelocity.mock.lastCall;

    expect(velocityX).toBeLessThan(0);
    expect(velocityY).toBe(0);
    expect(entry.recoveryUntil).toBeGreaterThan(500);
  });

  it('treats embedded actors as blocked for stuck recovery', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(40, 40);
    const shadow = createShadow(40, 40);

    sprite.body.embedded = true;

    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 84,
              y: 40,
            },
          },
        ],
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'right',
      lastProgressAt: 0,
      lastProgressDistance: 44,
      lastRouteIndex: 0,
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      shadow,
      sprite,
      stuckAttemptCount: 0,
      stuckRouteIndex: -1,
      waitUntil: 0,
    };

    scene.updateSceneActor(entry, 500);

    expect(entry.recoveryUntil).toBeGreaterThan(500);
    expect(sprite.setVelocity).toHaveBeenCalled();
  });

  it('adds a sidestep after a repeated stuck recovery attempt on the same route point', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(40, 40);
    const shadow = createShadow(40, 40);

    sprite.body.blocked.right = true;
    sprite.body.touching.right = true;

    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 84,
              y: 40,
            },
          },
        ],
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'right',
      lastProgressAt: 0,
      lastProgressDistance: 44,
      lastRouteIndex: 0,
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      shadow,
      sprite,
      stuckAttemptCount: 1,
      stuckRouteIndex: 0,
      waitUntil: 0,
    };

    scene.updateSceneActor(entry, 500);

    const [velocityX, velocityY] = sprite.setVelocity.mock.lastCall;

    expect(velocityX).toBeLessThan(0);
    expect(Math.abs(velocityY)).toBeGreaterThan(0);
    expect(entry.stuckAttemptCount).toBe(2);
  });

  it('skips past a bad target after repeated recovery attempts on the same blocked route point', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(40, 40);
    const shadow = createShadow(40, 40);

    sprite.body.blocked.left = true;
    sprite.body.touching.left = true;

    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 10,
              y: 40,
            },
          },
          {
            target: {
              x: 80,
              y: 40,
            },
          },
        ],
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'left',
      lastProgressAt: 0,
      lastProgressDistance: 30,
      lastRouteIndex: 0,
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      shadow,
      sprite,
      stuckAttemptCount: 3,
      stuckRouteIndex: 0,
      waitUntil: 0,
    };

    scene.updateSceneActor(entry, 500);

    expect(entry.currentRouteIndex).toBe(1);
    expect(entry.waitUntil).toBe(580);
    expect(sprite.setVelocity).toHaveBeenCalledWith(0, 0);
  });

  it('snaps a stuck nav actor to the nearest node and replans from there', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(58, 42);
    const shadow = createShadow(58, 42);

    sprite.body.blocked.right = true;
    sprite.body.touching.right = true;

    const navObjects = [
      createPointObject('DISTRICT_01_NODE_A', 40, 40),
      createPointObject('DISTRICT_01_NODE_B', 100, 40),
      createPointObject('DISTRICT_01_NODE_DEST', 160, 40),
    ];

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints' ? { objects: navObjects } : { objects: [] }
    );

    const entry = {
      actorConfig: {
        navGraph: {
          layerName: 'NPCWalkPoints',
          maxNeighbors: 2,
          nodeWeightMultipliers: {
            DISTRICT_01_NODE_B: 0,
            DISTRICT_01_NODE_DEST: 4,
          },
        },
        spawn: {
          layerName: 'NPCWalkPoints',
          objectName: 'DISTRICT_01_NODE_A',
        },
      },
      animationKeys: {
        idleDown: 'idle-down',
        idleSide: 'idle-side',
        idleUp: 'idle-up',
        walkDown: 'walk-down',
        walkSide: 'walk-side',
        walkUp: 'walk-up',
      },
      currentRouteIndex: 0,
      facing: 'right',
      lastProgressAt: 0,
      lastProgressDistance: 48,
      lastRouteIndex: 0,
      navState: {
        blockedCrosswalkPairId: null,
        crosswalkCooldownActive: false,
        crosswalkFollowUpRule: null,
        currentNodeName: null,
        lastDestinationNodeName: null,
      },
      pendingResume: null,
      recoveryUntil: 0,
      recoveryVector: null,
      route: [
        {
          navNodeName: 'DISTRICT_01_NODE_B',
          target: {
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_NODE_B',
          },
        },
      ],
      shadow,
      sprite,
      stuckAttemptCount: 3,
      stuckRouteIndex: 0,
      waitUntil: 0,
    };

    const recovered = scene.tryRecoverStuckSceneActor(entry, entry.route, 42, 0, 28, 500);

    expect(recovered).toBe(true);
    expect(sprite.setPosition).toHaveBeenCalledWith(40, 40);
    expect(entry.navState.currentNodeName).toBe('DISTRICT_01_NODE_A');
    expect(entry.currentRouteIndex).toBe(0);
    expect(entry.route.length).toBeGreaterThan(0);
    expect(entry.route[0].navNodeName).not.toBe('DISTRICT_01_NODE_A');
    expect(entry.waitUntil).toBe(580);
  });

  it('animates the existing persistent scene door during a door transition', () => {
    const scene = createScene({ sceneDoors: [] });
    const closedDoorSprite = createSprite(40, 60);

    scene.sceneDoorEntries = [
      {
        id: 'test-door',
        sceneDoorConfig: {
          closedFrame: 0,
        },
        sprite: closedDoorSprite,
      },
    ];

    scene.playDoorTransitionEffect({
      appearance: {
        animationKeyPrefix: 'city-preview-door:test-door',
        frameCount: 4,
        textureKey: 'city-preview-door:test-door:sheet',
      },
      overlayTarget: {
        x: 40,
        y: 60,
      },
      sceneDoorId: 'test-door',
    });

    expect(scene.add.sprite).not.toHaveBeenCalled();
    expect(closedDoorSprite.play).toHaveBeenNthCalledWith(
      1,
      'city-preview-door:test-door:anim:open',
      true
    );
    expect(closedDoorSprite.play).toHaveBeenNthCalledWith(
      2,
      'city-preview-door:test-door:anim:close',
      true
    );
    expect(closedDoorSprite.setVisible.mock.calls.some(([value]) => value === false)).toBe(false);
  });
});
