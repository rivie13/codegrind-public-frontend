import { describe, expect, it, vi } from 'vitest';

import {
  createShadow,
  createSprite,
  createAppearance,
  createPointObject,
  createScene,
} from './sceneActorTestHelpers';

describe('apartmentPreviewScene actors 1', () => {
  it('creates static and roaming scene actors with PEC animation sets', () => {
    const appearance = createAppearance('city-preview-scene-actor:test-civilian');
    const scene = createScene({
      sceneActors: [
        {
          appearance,
          collidesWithWorld: false,
          id: 'vendor',
          spawn: {
            anchor: 'center',
            layerName: 'Interactables',
            objectName: 'VendorCounter',
          },
        },
        {
          appearance,
          id: 'walker',
          route: [
            {
              target: {
                x: 124,
                y: 200,
              },
            },
          ],
          spawn: {
            x: 100,
            y: 200,
          },
        },
      ],
    });

    scene.createSceneActors();

    expect(scene.sceneActorEntries).toHaveLength(2);
    expect(scene.physics.add.sprite).toHaveBeenNthCalledWith(
      1,
      300,
      160,
      'city-preview-scene-actor:test-civilian:idle:down'
    );
    expect(scene.physics.add.sprite).toHaveBeenNthCalledWith(
      2,
      100,
      200,
      'city-preview-scene-actor:test-civilian:idle:down'
    );
    expect(scene.sceneActorEntries[0].sprite.setOrigin).toHaveBeenCalledWith(0.5, 32 / 48);
    expect(scene.sceneActorEntries[0].sprite.setScale).toHaveBeenCalledWith(2);
    expect(scene.sceneActorEntries[1].sprite.setSlideFactor).toHaveBeenCalledWith(0, 0);
    expect(scene.physics.add.collider).toHaveBeenCalledTimes(1);
    expect(scene.anims.create).toHaveBeenCalledTimes(6);
  });

  it('adds world collision for nav-graph driven actors', () => {
    const appearance = createAppearance('city-preview-scene-actor:test-nav-world');
    const scene = createScene({
      sceneActors: [
        {
          appearance,
          id: 'nav-walker',
          navGraph: {
            layerName: 'NPCWalkPoints',
          },
          spawn: {
            layerName: 'NPCWalkPoints',
            objectName: 'DISTRICT_01_CROSSWALK_RIGHT',
          },
        },
      ],
    });

    scene.getMapObjectLayer = vi.fn((layerName) =>
      layerName === 'NPCWalkPoints'
        ? {
            objects: [createPointObject('DISTRICT_01_CROSSWALK_RIGHT', 176, 74)],
          }
        : { objects: [] }
    );

    scene.createSceneActors();

    expect(scene.sceneActorEntries).toHaveLength(1);
    expect(
      scene.physics.add.collider.mock.calls.some(
        ([first, second]) =>
          first === scene.sceneActorEntries[0].sprite && second === scene.collisionBodies
      )
    ).toBe(true);
  });

  it('adds roaming actor colliders against the player and other roaming actors', () => {
    const appearance = createAppearance('city-preview-scene-actor:test-collider');
    const scene = createScene({
      sceneActors: [
        {
          appearance,
          id: 'walker-a',
          route: [
            {
              target: {
                x: 124,
                y: 200,
              },
            },
          ],
          spawn: {
            x: 100,
            y: 200,
          },
        },
        {
          appearance,
          id: 'walker-b',
          route: [
            {
              target: {
                x: 184,
                y: 200,
              },
            },
          ],
          spawn: {
            x: 160,
            y: 200,
          },
        },
      ],
    });

    scene.player = createSprite(220, 220);

    scene.createSceneActors();

    expect(
      scene.physics.add.collider.mock.calls.some(
        ([first, second]) => first === scene.sceneActorEntries[0].sprite && second === scene.player
      )
    ).toBe(true);
    expect(
      scene.physics.add.collider.mock.calls.some(
        ([first, second]) =>
          first === scene.sceneActorEntries[1].sprite &&
          second === scene.sceneActorEntries[0].sprite
      )
    ).toBe(true);
  });

  it('creates persistent closed doors at authored door markers', () => {
    const scene = createScene({
      sceneDoors: [
        {
          appearance: {
            depth: 141,
            originX: 0.5,
            originY: 1,
            scale: 1,
            textureKey: 'city-preview-door:test-door:sheet',
          },
          closedFrame: 0,
          id: 'test-door',
          target: {
            x: 40,
            y: 60,
          },
        },
      ],
    });

    scene.createSceneDoors();

    expect(scene.sceneDoorEntries).toHaveLength(1);
    expect(scene.add.sprite).toHaveBeenCalledWith(40, 60, 'city-preview-door:test-door:sheet', 0);
  });

  it('syncs the actor body from the snapped door-transition position without resetting it away from the sprite', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);

    scene.resolveSpawnTargetPosition = vi.fn(() => ({ x: 48, y: 120 }));

    scene.alignActorWithDoorTransition(
      {
        overlayTarget: {
          layerName: 'Collision',
          objectName: 'LEARNING_PATH_BUILDING_DOOR_PLACEMENT',
        },
        playerSnapOffsetY: -6,
      },
      sprite
    );

    expect(sprite.body.stop).toHaveBeenCalledOnce();
    expect(sprite.setPosition).toHaveBeenCalledWith(48, 114);
    expect(sprite.body.updateFromGameObject).toHaveBeenCalledOnce();
    expect(sprite.body.reset).not.toHaveBeenCalled();
  });

  it('hides an actor during a doorway transition and restores it at the resume point', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);
    const shadow = createShadow(20, 40);
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
              nextRouteIndex: 0,
              resumeTarget: {
                x: 10,
                y: 12,
              },
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

    scene.updateSceneActor(entry, 1000);

    expect(entry.pendingResume).toMatchObject({
      nextRouteIndex: 0,
      position: {
        x: 10,
        y: 12,
      },
      resumeAt: 1500,
    });
    expect(entry.sprite.body.enable).toBe(false);
    expect(entry.sprite.visible).toBe(false);

    scene.updateSceneActor(entry, 1600);

    expect(entry.pendingResume).toBeNull();
    expect(entry.sprite.body.enable).toBe(true);
    expect(entry.sprite.setPosition).toHaveBeenCalledWith(10, 12);
    expect(entry.sprite.visible).toBe(true);
  });

  it('uses the shared door transition helper when a route point defines a door effect', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);
    const shadow = createShadow(20, 40);
    const alignActorWithDoorTransition = vi.fn();
    const playDoorTransitionEffect = vi.fn(() => true);
    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 20,
              y: 40,
            },
            transition: {
              effect: {
                appearance: {
                  animationKeyPrefix: 'city-preview-door:test-door',
                  frameCount: 4,
                  textureKey: 'city-preview-door:test-door:sheet',
                },
              },
              hiddenDurationMs: 500,
              resumeTarget: {
                x: 10,
                y: 12,
              },
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

    scene.alignActorWithDoorTransition = alignActorWithDoorTransition;
    scene.playDoorTransitionEffect = playDoorTransitionEffect;

    scene.updateSceneActor(entry, 0);

    expect(alignActorWithDoorTransition).toHaveBeenCalledWith(
      entry.actorConfig.route[0].transition.effect,
      sprite
    );
    expect(playDoorTransitionEffect).toHaveBeenCalledWith(
      entry.actorConfig.route[0].transition.effect,
      expect.objectContaining({
        actor: sprite,
        shadow,
      })
    );
    expect(entry.pendingResume).toMatchObject({
      position: {
        x: 10,
        y: 12,
      },
    });
  });

  it('can hide an actor immediately when a door entry should not reveal a snap-to-door teleport', () => {
    const scene = createScene({ sceneActors: [] });
    const sprite = createSprite(20, 40);
    const shadow = createShadow(20, 40);
    const alignActorWithDoorTransition = vi.fn();
    const playDoorTransitionEffect = vi.fn(() => true);
    const entry = {
      actorConfig: {
        route: [
          {
            target: {
              x: 20,
              y: 40,
            },
            transition: {
              effect: {
                appearance: {
                  animationKeyPrefix: 'city-preview-door:test-door',
                  frameCount: 4,
                  textureKey: 'city-preview-door:test-door:sheet',
                },
              },
              hiddenDurationMs: 500,
              hideActorImmediately: true,
              resumeTarget: {
                x: 10,
                y: 12,
              },
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

    scene.alignActorWithDoorTransition = alignActorWithDoorTransition;
    scene.playDoorTransitionEffect = playDoorTransitionEffect;

    scene.updateSceneActor(entry, 0);

    expect(alignActorWithDoorTransition).not.toHaveBeenCalled();
    expect(entry.sprite.visible).toBe(false);
    expect(playDoorTransitionEffect).toHaveBeenCalledWith(
      entry.actorConfig.route[0].transition.effect,
      expect.objectContaining({
        actor: sprite,
        hideActorAfterMs: false,
      })
    );
  });
});
