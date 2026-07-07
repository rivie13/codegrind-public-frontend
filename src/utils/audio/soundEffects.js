/**
 * Sound effects configuration for Tower Defense game
 * This file contains the mapping of sound effect IDs to their file paths
 */

import audioManager from './AudioManager';
import getAssetUrl from '../assets/assetUrl';

const applyAssetBase = (effect) => {
  if (Array.isArray(effect)) {
    return effect.map(applyAssetBase);
  }
  if (effect && effect.path) {
    return { ...effect, path: getAssetUrl(effect.path) };
  }
  return effect;
};

/**
 * Sound effect definitions
 * Each object contains:
 * - id: Unique identifier for the sound effect
 * - name: Human-readable name
 * - path: Path to the sound file (relative to public folder)
 * - volume: Optional volume adjustment for this specific sound
 */
const SOUND_EFFECTS_RAW = [
  {
    id: 'demo-boot',
    name: 'Demo Boot Sequence',
    path: '/audio/Windows_NT_-_Boot.mp3',
    volume: 0.9,
  },
  {
    id: 'wave-start',
    name: 'Wave Start',
    path: '/audio/wave-start.mp3',
    volume: 0.8,
  },
  {
    id: 'enemy-defeated',
    name: 'Enemy Defeated',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_enemy_defeated.wav',
    volume: 0.6,
  },
  {
    id: 'projectile-hit',
    name: 'Projectile Hit',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_projectile_hit.wav',
    volume: 0.6,
  },
  {
    id: 'enemy-reach-end',
    name: 'Enemy Reach End',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_enemy_reach_end1.wav',
    volume: 0.7,
  },
  {
    id: 'tower-placed',
    name: 'Tower Placed',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_placed.wav',
    volume: 0.6,
  },
  {
    id: 'tower-upgraded',
    name: 'Tower Upgraded',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_upgrade.wav',
    volume: 0.7,
  },
  {
    id: 'tower-special-upgraded',
    name: 'Special Upgrade Purchased',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_specialupgrade.wav',
    volume: 0.75,
  },
  {
    id: 'level-complete',
    name: 'Level Complete',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelcomplete.wav',
    volume: 0.9,
  },
  {
    id: 'game-over',
    name: 'Game Over',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_gameover.wav',
    volume: 0.8,
  },
  {
    id: 'button-click',
    name: 'Button Click',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_buttonclick.wav',
    volume: 0.5,
  },
  {
    id: 'ui-hover',
    name: 'UI Hover',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_ui_hover.wav',
    volume: 0.3,
  },
  {
    id: 'error',
    name: 'Error',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_error_sound.wav',
    volume: 0.6,
  },
  {
    id: 'progress-bar',
    name: 'Progress Bar Fill',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_xp_progressbar.wav',
    volume: 0.55,
  },
  {
    id: 'level-up-begin',
    name: 'Level Up Begin',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
    volume: 0.75,
  },
  {
    id: 'level-up-end',
    name: 'Level Up End',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
    volume: 0.8,
  },
  {
    id: 'level-up-impact',
    name: 'Level Up Impact',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
    volume: 0.9,
  },
  {
    id: 'level-up-thud',
    name: 'Level Up Thud',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_thud_impact.wav',
    volume: 0.85,
  },
  {
    id: 'deployable-placed',
    name: 'Deployable Placed',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_placed.wav',
    volume: 0.7,
  },
  {
    id: 'deployable-armed',
    name: 'Deployable Armed',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_armed.wav',
    volume: 0.7,
  },
  {
    id: 'deployable-triggered',
    name: 'Deployable Triggered',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_triggered.wav',
    volume: 0.75,
  },
  {
    id: 'deployable-active-loop',
    name: 'Deployable Active Loop',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_active_loop.wav',
    volume: 0.6,
  },
  {
    id: 'deployable-expire',
    name: 'Deployable Expire',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_expire.wav',
    volume: 0.7,
  },
  {
    id: 'deployable-DataMine',
    name: 'Deployable Data Mine',
    path: '/audio/generated_sound_effects/deployable_sfx/DataMine.wav',
    volume: 0.8,
  },
  {
    id: 'deployable-ICETrap',
    name: 'Deployable ICE Trap',
    path: '/audio/generated_sound_effects/deployable_sfx/ICETrap.wav',
    volume: 0.75,
  },
  {
    id: 'deployable-BandwidthThrottle',
    name: 'Deployable Bandwidth Throttle',
    path: '/audio/generated_sound_effects/deployable_sfx/BandwidthThrottle.wav',
    volume: 0.7,
  },
  {
    id: 'deployable-BufferOverflow',
    name: 'Deployable Buffer Overflow',
    path: '/audio/generated_sound_effects/deployable_sfx/BufferOverflow.wav',
    volume: 0.8,
  },
  {
    id: 'deployable-FirewallShard',
    name: 'Deployable Firewall Shard',
    path: '/audio/generated_sound_effects/deployable_sfx/FirewallShard.wav',
    volume: 0.75,
  },
  {
    id: 'deployable-LogicBomb',
    name: 'Deployable Logic Bomb',
    path: '/audio/generated_sound_effects/deployable_sfx/LogicBomb.wav',
    volume: 0.85,
  },
  {
    id: 'wave-complete',
    name: 'Wave Complete',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_wave_complete.wav',
    volume: 0.75,
  },
  {
    id: 'solution-successful',
    name: 'Solution Successful',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_solution_successful.wav',
    volume: 0.85,
  },
  {
    id: 'solution-failed',
    name: 'Solution Failed',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_solution_failed.wav',
    volume: 0.85,
  },
];

export const SOUND_EFFECTS = SOUND_EFFECTS_RAW.map(applyAssetBase);

/**
 * Recommended sound mappings
 * These are the specific sound files we recommend using
 */
export const RECOMMENDED_SOUNDS = {
  'demo-boot': 'Custom/Blob SFX',
  'wave-start': 'Generated SFX',
  'enemy-defeated': 'Generated SFX',
  'projectile-hit': 'Generated SFX',
  'enemy-reach-end': 'Generated SFX',
  'tower-placed': 'Generated SFX',
  'tower-upgraded': 'Generated SFX',
  'tower-special-upgraded': 'Generated SFX',
  'level-complete': 'Generated SFX',
  'game-over': 'Generated SFX',
  'button-click': 'Generated SFX',
  'ui-hover': 'Generated SFX',
  error: 'Generated SFX',
  'progress-bar': 'Generated SFX',
  'level-up-begin': 'Generated SFX',
  'level-up-end': 'Generated SFX',
  'level-up-impact': 'Generated SFX',
  'level-up-thud': 'Generated SFX',
  'deployable-placed': 'Generated SFX',
  'deployable-armed': 'Generated SFX',
  'deployable-triggered': 'Generated SFX',
  'deployable-active-loop': 'Generated SFX',
  'deployable-expire': 'Generated SFX',
  'deployable-DataMine': 'Generated SFX',
  'deployable-ICETrap': 'Generated SFX',
  'deployable-BandwidthThrottle': 'Generated SFX',
  'deployable-BufferOverflow': 'Generated SFX',
  'deployable-FirewallShard': 'Generated SFX',
  'deployable-LogicBomb': 'Generated SFX',
  'wave-complete': 'Generated SFX',
  'solution-successful': 'Generated SFX',
  'solution-failed': 'Generated SFX',
};

/**
 * Sound effects for the Tower Defense game
 */
const soundEffectsRaw = {
  // UI Sounds
  'demo-boot': {
    id: 'demo-boot',
    path: '/audio/Windows_NT_-_Boot.mp3',
  },
  'button-click': {
    id: 'button-click',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_buttonclick.wav',
  },
  'ui-hover': {
    id: 'ui-hover',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_ui_hover.wav',
  },
  error: {
    id: 'error',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_error_sound.wav',
  },
  'progress-bar': {
    id: 'progress-bar',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_xp_progressbar.wav',
  },
  'level-up-begin': {
    id: 'level-up-begin',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
  },
  'level-up-end': {
    id: 'level-up-end',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
  },
  'level-up-impact': {
    id: 'level-up-impact',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelup.wav',
  },
  'level-up-thud': {
    id: 'level-up-thud',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_thud_impact.wav',
  },
  'solution-successful': {
    id: 'solution-successful',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_solution_successful.wav',
  },
  'solution-failed': {
    id: 'solution-failed',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_solution_failed.wav',
  },
  'deployable-placed': {
    id: 'deployable-placed',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_placed.wav',
  },
  'deployable-armed': {
    id: 'deployable-armed',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_armed.wav',
  },
  'deployable-triggered': {
    id: 'deployable-triggered',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_triggered.wav',
  },
  'deployable-active-loop': {
    id: 'deployable-active-loop',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_active_loop.wav',
  },
  'deployable-expire': {
    id: 'deployable-expire',
    path: '/audio/generated_sound_effects/deployable_sfx/deployable_expire.wav',
  },
  'deployable-DataMine': {
    id: 'deployable-DataMine',
    path: '/audio/generated_sound_effects/deployable_sfx/DataMine.wav',
  },
  'deployable-ICETrap': {
    id: 'deployable-ICETrap',
    path: '/audio/generated_sound_effects/deployable_sfx/ICETrap.wav',
  },
  'deployable-BandwidthThrottle': {
    id: 'deployable-BandwidthThrottle',
    path: '/audio/generated_sound_effects/deployable_sfx/BandwidthThrottle.wav',
  },
  'deployable-BufferOverflow': {
    id: 'deployable-BufferOverflow',
    path: '/audio/generated_sound_effects/deployable_sfx/BufferOverflow.wav',
  },
  'deployable-FirewallShard': {
    id: 'deployable-FirewallShard',
    path: '/audio/generated_sound_effects/deployable_sfx/FirewallShard.wav',
  },
  'deployable-LogicBomb': {
    id: 'deployable-LogicBomb',
    path: '/audio/generated_sound_effects/deployable_sfx/LogicBomb.wav',
  },

  // Gameplay Sounds
  'tower-placed': {
    id: 'tower-placed',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_placed.wav',
  },
  'tower-upgraded': {
    id: 'tower-upgraded',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_upgrade.wav',
  },
  'tower-special-upgraded': {
    id: 'tower-special-upgraded',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_tower_specialupgrade.wav',
  },
  'enemy-defeated': {
    id: 'enemy-defeated',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_enemy_defeated.wav',
  },
  'projectile-hit': {
    id: 'projectile-hit',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_projectile_hit.wav',
  },
  'enemy-reach-end': {
    id: 'enemy-reach-end',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_enemy_reach_end1.wav',
  },
  'wave-start': { id: 'wave-start', path: '/audio/wave-start.mp3' },
  'wave-complete': {
    id: 'wave-complete',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_wave_complete.wav',
  },
  'level-complete': {
    id: 'level-complete',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_levelcomplete.wav',
  },
  'game-over': {
    id: 'game-over',
    path: '/audio/generated_sound_effects/event_sound_effects/cyberpunk_gameover.wav',
  },

  // Tower-specific projectile sounds
  'projectile-shot-ForLoop': {
    id: 'projectile-shot-ForLoop',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_forloop_projectile.wav',
  },
  'projectile-shot-WhileLoop': {
    id: 'projectile-shot-WhileLoop',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_WhileLoop_beam_projectile.wav',
  },
  'projectile-shot-IfCondition': {
    id: 'projectile-shot-IfCondition',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_IfCondition_projectile.wav',
  },
  'projectile-shot-Variable': {
    id: 'projectile-shot-Variable',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_Variable_projectile.wav',
  },
  'projectile-shot-Function': {
    id: 'projectile-shot-Function',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_Function_projectile.wav',
  },
  'projectile-shot-Array': {
    id: 'projectile-shot-Array',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_array_projectile.wav',
  },
  'projectile-shot-Object': {
    id: 'projectile-shot-Object',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_object_projectile.wav',
  },
  'projectile-shot-Return': {
    id: 'projectile-shot-Return',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_return_projectile.wav',
  },
  'projectile-shot-TryCatch': {
    id: 'projectile-shot-TryCatch',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_trycatch_projectile.wav',
  },
  'projectile-shot-Switch': {
    id: 'projectile-shot-Switch',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_switch_projectile.wav',
  },
  'projectile-shot-BurstTurret': {
    id: 'projectile-shot-BurstTurret',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_BurstTurret_projectile.wav',
  },
  'projectile-shot-BlastTurret': {
    id: 'projectile-shot-BlastTurret',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_BlastTurret_projectile.wav',
  },
  'projectile-shot-AIAssist': {
    id: 'projectile-shot-AIAssist',
    path: '/audio/generated_sound_effects/tower_projectile_sounds/cyberpunk_Function_projectile.wav',
  },

  // Background Music Tracks
  BACKGROUND_MUSIC: [
    // Karl Casey's White Bat Audio tracks
    {
      id: '10-to-midnight',
      path: '/audio/karl-casey/10 to Midnight.mp3',
      title: '10 to Midnight',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'acacia',
      path: '/audio/karl-casey/Acacia.mp3',
      title: 'Acacia',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'alliance',
      path: '/audio/karl-casey/Alliance.mp3',
      title: 'Alliance',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'ammunition',
      path: '/audio/karl-casey/Ammunition.mp3',
      title: 'Ammunition',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'angel-heart',
      path: '/audio/karl-casey/Angel Heart.mp3',
      title: 'Angel Heart',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'anima',
      path: '/audio/karl-casey/Anima.mp3',
      title: 'Anima',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'aura',
      path: '/audio/karl-casey/Aura.mp3',
      title: 'Aura',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'b-f-g',
      path: '/audio/karl-casey/B.F.G..mp3',
      title: 'B.F.G.',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'body-double',
      path: '/audio/karl-casey/Body Double.mp3',
      title: 'Body Double',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'casualty',
      path: '/audio/karl-casey/Casualty.mp3',
      title: 'Casualty',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'centurion',
      path: '/audio/karl-casey/Centurion.mp3',
      title: 'Centurion',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'channel-4',
      path: '/audio/karl-casey/Channel 4.mp3',
      title: 'Channel 4',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'consumed',
      path: '/audio/karl-casey/Consumed.mp3',
      title: 'Consumed',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'corrosive',
      path: '/audio/karl-casey/Corrosive.mp3',
      title: 'Corrosive',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'cosmic-death-machine',
      path: '/audio/karl-casey/Cosmic Death Machine.mp3',
      title: 'Cosmic Death Machine',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'countach',
      path: '/audio/karl-casey/Countach.mp3',
      title: 'Countach',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'dead-silence',
      path: '/audio/karl-casey/Dead Silence.mp3',
      title: 'Dead Silence',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'departure',
      path: '/audio/karl-casey/Departure.mp3',
      title: 'Departure',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'destroyer',
      path: '/audio/karl-casey/Destroyer.mp3',
      title: 'Destroyer',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'dissent',
      path: '/audio/karl-casey/dissent.mp3',
      title: 'Dissent',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'diva',
      path: '/audio/karl-casey/Diva.mp3',
      title: 'Diva',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'doomed-to-survive',
      path: '/audio/karl-casey/Doomed to Survive.mp3',
      title: 'Doomed to Survive',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'dragged-across-concrete',
      path: '/audio/karl-casey/dragged-across-concrete.mp3',
      title: 'Dragged Across Concrete',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'dream-of-mirrors',
      path: '/audio/karl-casey/Dream of Mirrors.mp3',
      title: 'Dream of Mirrors',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'elysium',
      path: '/audio/karl-casey/Elysium.mp3',
      title: 'Elysium',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'empty-city',
      path: '/audio/karl-casey/Empty City.mp3',
      title: 'Empty City',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'enslaved',
      path: '/audio/karl-casey/Enslaved.mp3',
      title: 'Enslaved',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'faces-of-death',
      path: '/audio/karl-casey/Faces of Death.mp3',
      title: 'Faces of Death',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'ghost-protocol',
      path: '/audio/karl-casey/Ghost Protocol.mp3',
      title: 'Ghost Protocol',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'i-must-not-fear',
      path: '/audio/karl-casey/I Must Not Fear.mp3',
      title: 'I Must Not Fear',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'jupiter',
      path: '/audio/karl-casey/Jupiter.mp3',
      title: 'Jupiter',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'kryptos',
      path: '/audio/karl-casey/kryptos.mp3',
      title: 'Kryptos',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'last-man-standing',
      path: '/audio/karl-casey/Last Man Standing.mp3',
      title: 'Last Man Standing',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'looking-back',
      path: '/audio/karl-casey/Looking Back.mp3',
      title: 'Looking Back',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'lost-vegas',
      path: '/audio/karl-casey/Lost Vegas.mp3',
      title: 'Lost Vegas',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'menace',
      path: '/audio/karl-casey/Menace.mp3',
      title: 'Menace',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'miami-justice',
      path: '/audio/karl-casey/Miami Justice.mp3',
      title: 'Miami Justice',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'midnight-run',
      path: '/audio/karl-casey/Midnight Run.mp3',
      title: 'Midnight Run',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'new-beginnings',
      path: '/audio/karl-casey/New Beginnings.mp3',
      title: 'New Beginnings',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'night-crawler',
      path: '/audio/karl-casey/Night Crawler.mp3',
      title: 'Night Crawler',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'notorious',
      path: '/audio/karl-casey/Notorious.mp3',
      title: 'Notorious',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'ocean-view',
      path: '/audio/karl-casey/Ocean View.mp3',
      title: 'Ocean View',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'patrol-bot',
      path: '/audio/karl-casey/Patrol Bot.mp3',
      title: 'Patrol Bot',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'pentagram',
      path: '/audio/karl-casey/Pentagram.mp3',
      title: 'Pentagram',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'playback',
      path: '/audio/karl-casey/Playback.mp3',
      title: 'Playback',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'radiation-sickness',
      path: '/audio/karl-casey/radiation-sickness.mp3',
      title: 'Radiation Sickness',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'reckless-love',
      path: '/audio/karl-casey/Reckless Love.mp3',
      title: 'Reckless Love',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'sanctum',
      path: '/audio/karl-casey/sanctum.mp3',
      title: 'Sanctum',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'sanity-unravels',
      path: '/audio/karl-casey/Sanity Unravels.mp3',
      title: 'Sanity Unravels',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'self-inflicted',
      path: '/audio/karl-casey/Self Inflicted.mp3',
      title: 'Self Inflicted',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'she-needs-you',
      path: '/audio/karl-casey/She Needs You.mp3',
      title: 'She Needs You',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'somewhere-in-time',
      path: '/audio/karl-casey/Somewhere in Time.mp3',
      title: 'Somewhere in Time',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'sulaco',
      path: '/audio/karl-casey/Sulaco.mp3',
      title: 'Sulaco',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'tenebrae',
      path: '/audio/karl-casey/Tenebrae.mp3',
      title: 'Tenebrae',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'the-bouncer',
      path: '/audio/karl-casey/The Bouncer.mp3',
      title: 'The Bouncer',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'the-prophet',
      path: '/audio/karl-casey/The Prophet.mp3',
      title: 'The Prophet',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'the-resistance',
      path: '/audio/karl-casey/The Resistance.mp3',
      title: 'The Resistance',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'the-traveler',
      path: '/audio/karl-casey/The Traveler.mp3',
      title: 'The Traveler',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'the-witch',
      path: '/audio/karl-casey/The Witch.mp3',
      title: 'The Witch',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'thirst',
      path: '/audio/karl-casey/Thirst.mp3',
      title: 'Thirst',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'torn-flesh',
      path: '/audio/karl-casey/Torn Flesh.mp3',
      title: 'Torn Flesh',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'touch-the-sky',
      path: '/audio/karl-casey/Touch the Sky.mp3',
      title: 'Touch the Sky',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'tyrell-corporation',
      path: '/audio/karl-casey/Tyrell Corporation.mp3',
      title: 'Tyrell Corporation',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'unhuman',
      path: '/audio/karl-casey/Unhuman.mp3',
      title: 'Unhuman',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'vhs-vision',
      path: '/audio/karl-casey/VHS Vision.mp3',
      title: 'VHS Vision',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'war-games',
      path: '/audio/karl-casey/War Games.mp3',
      title: 'War Games',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'warhead',
      path: '/audio/karl-casey/Warhead.mp3',
      title: 'Warhead',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'whistler',
      path: '/audio/karl-casey/whistler.mp3',
      title: 'Whistler',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'white-lotus',
      path: '/audio/karl-casey/White Lotus.mp3',
      title: 'White Lotus',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'xerxes',
      path: '/audio/karl-casey/Xerxes.mp3',
      title: 'Xerxes',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
    {
      id: 'you-cant-kill-the-boogeyman',
      path: '/audio/karl-casey/You Can’t Kill the Boogeyman.mp3',
      title: 'You Can’t Kill the Boogeyman',
      artist: 'Karl Casey',
      attribution: 'Karl Casey @ White Bat Audio',
    },
  ],
};

const soundEffects = Object.fromEntries(
  Object.entries(soundEffectsRaw).map(([key, value]) => [key, applyAssetBase(value)])
);

/**
 * Background music tracks (exported list)
 */
export const BACKGROUND_MUSIC = soundEffects.BACKGROUND_MUSIC;

/**
 * Load all sound effects into the audio manager
 */
export const loadSoundEffects = () => {
  // Load UI and gameplay sound effects
  Object.values(soundEffects).forEach((effect) => {
    if (effect === soundEffects.BACKGROUND_MUSIC) {
      return;
    }
    if (Array.isArray(effect)) {
      effect.forEach((variant) => {
        if (variant.id && variant.path) {
          audioManager.loadSoundEffect(variant.id, variant.path);
        }
      });
      return;
    }

    if (effect.id && effect.path) {
      // Only load individual sound effects
      audioManager.loadSoundEffect(effect.id, effect.path);
    }
  });

  //console.log('[AUDIO] Sound effects loaded successfully');
};

export default soundEffects;
