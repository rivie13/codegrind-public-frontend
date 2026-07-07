import { attachInteractionNavigationMethods } from './interactions/interactionNavigationMethods';
import { attachInteractionMapPointMethods } from './interactions/interactionMapPointMethods';
import { attachInteractionWorldSetupMethods } from './interactions/interactionWorldSetupMethods';
import { attachCollectibleInteractionMethods } from './interactions/collectibleInteractionMethods';
import { attachInteractionDetailMethods } from './interactions/interactionDetailMethods';
import { attachPlayerControlInteractionMethods } from './interactions/playerControlInteractionMethods';
import { attachPlayerHudInteractionMethods } from './interactions/playerHudInteractionMethods';
import { attachObjectiveStateMethods } from './interactions/objectiveStateMethods';
import { attachPreviewBridgeStateMethods } from './interactions/previewBridgeStateMethods';
import { attachInteractionLabelMethods } from './interactions/interactionLabelMethods';

export const attachApartmentPreviewSceneInteractionMethods = (SceneClass, Phaser) => {
  attachInteractionNavigationMethods(SceneClass, Phaser);
  attachInteractionMapPointMethods(SceneClass, Phaser);
  attachInteractionWorldSetupMethods(SceneClass, Phaser);
  attachCollectibleInteractionMethods(SceneClass, Phaser);
  attachInteractionDetailMethods(SceneClass, Phaser);
  attachPlayerControlInteractionMethods(SceneClass, Phaser);
  attachPlayerHudInteractionMethods(SceneClass, Phaser);
  attachObjectiveStateMethods(SceneClass, Phaser);
  attachPreviewBridgeStateMethods(SceneClass, Phaser);
  attachInteractionLabelMethods(SceneClass, Phaser);
};
