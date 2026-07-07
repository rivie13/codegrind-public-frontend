import audioService from '../../../../utils/audio/AudioService';
import { deployableTypeSoundMap, towerProjectileSoundMap } from './engineAudioMaps';

export const registerEngineAudioHandlers = (engine) => {
  if (!engine) return;

  engine.on('tower-attack', (data) => {
    const towerType = data?.tower?.type || 'ForLoop';
    const soundId = towerProjectileSoundMap[towerType] || towerProjectileSoundMap.ForLoop;
    audioService.playSoundEffect(soundId);
  });

  engine.on('projectile-hit', (data) => {
    if (!data?.killed) {
      audioService.playSoundEffect('projectile-hit');
    }
  });

  engine.on('deployable-placed', (data) => {
    audioService.playSoundEffect('deployable-placed');
    const deployableType = data?.deployable?.type;
    const typeSoundId = deployableTypeSoundMap[deployableType];
    if (typeSoundId) {
      audioService.playSoundEffect(typeSoundId);
    }
  });

  engine.on('game-over', () => {
    audioService.playSoundEffect('game-over');
  });

  engine.on('deployable-armed', () => {
    audioService.playSoundEffect('deployable-armed');
  });

  engine.on('deployable-triggered', (data) => {
    audioService.playSoundEffect('deployable-triggered');
    const deployableType = data?.deployable?.type;
    const typeSoundId = deployableTypeSoundMap[deployableType];
    if (typeSoundId) {
      audioService.playSoundEffect(typeSoundId);
    }
  });

  engine.on('deployable-active-loop', () => {
    audioService.playSoundEffect('deployable-active-loop');
  });

  engine.on('deployable-expire', () => {
    audioService.playSoundEffect('deployable-expire');
  });
};
