import { attachSceneActorCoreMethods } from './scene-actors/sceneActorCoreMethods';
import { attachSceneActorNavGraphMethods } from './scene-actors/sceneActorNavGraphMethods';
import { attachSceneActorNavRuleMethods } from './scene-actors/sceneActorNavRuleMethods';
import { attachSceneActorNavPlanningMethods } from './scene-actors/sceneActorNavPlanningMethods';
import { attachSceneActorAnimationDoorMethods } from './scene-actors/sceneActorAnimationDoorMethods';
import { attachSceneActorRuntimeMethods } from './scene-actors/sceneActorRuntimeMethods';

export const attachApartmentPreviewSceneActorMethods = (SceneClass, Phaser) => {
  attachSceneActorCoreMethods(SceneClass, Phaser);
  attachSceneActorNavGraphMethods(SceneClass, Phaser);
  attachSceneActorNavRuleMethods(SceneClass, Phaser);
  attachSceneActorNavPlanningMethods(SceneClass, Phaser);
  attachSceneActorAnimationDoorMethods(SceneClass, Phaser);
  attachSceneActorRuntimeMethods(SceneClass, Phaser);
};
