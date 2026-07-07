import { getTowerDefensePixelIconAsset } from '../../../utils/assets/towerDefenseAssetUrls';

const pixelIcon = (fileName) => getTowerDefensePixelIconAsset(fileName);

export const RETRO_DESKTOP_BACKGROUND_PACK = {
  id: 'retro-desktop-shell',
  name: 'Retro Desktop Shell',
  mapBackground: '#c0c0c0',
  mapVignetteColor: 'rgba(86, 86, 86, 0.08)',
  gridColor: 'rgba(128, 128, 128, 0.18)',
  gridEffectStyle: 'minesweeper-field',
  gridEffectColors: ['#7b7b7b', '#ffffff', '#2554c7'],
};

export const RETRO_DESKTOP_MAP_PACK = {
  id: 'retro-desktop-shell',
  name: 'Retro Desktop Shell',
  pathColor: '#d4d0c8',
  pathInnerColor: 'rgba(246, 246, 246, 0.98)',
  laneBorderColor: '#2554c7',
  accentLineColor: '#b13a2c',
  overlayStyle: 'none',
  overlayColors: ['#2554c7', '#ffffff', '#7b7b7b', '#d4d0c8'],
};

export const RETRO_DESKTOP_MAP_THEME = {
  ...RETRO_DESKTOP_BACKGROUND_PACK,
  ...RETRO_DESKTOP_MAP_PACK,
};

export const RETRO_DESKTOP_TOWER_PACK = {
  id: 'retro-desktop-shell',
  name: 'Retro Desktop Shell',
  towerColors: {
    FOR_LOOP: '#6FB9FF',
    WHILE_LOOP: '#78DEC3',
    IF_CONDITION: '#BEEB87',
    VARIABLE: '#EFF2BE',
    AI_ASSIST: '#EFC260',
    FUNCTION: '#729CFF',
    ARRAY: '#8FD6FF',
    CLASS: '#729CFF',
    TRY_CATCH: '#9EE39A',
    RETURN: '#F1CF76',
    LOG: '#FFA559',
  },
  towerBorderColor: '#E3E8C8',
  projectileColor: '#F0D47C',
  towerEffect: 'circuit-traces',
  towerSprites: {
    FOR_LOOP: pixelIcon(
      'Software_Terminal_Window_CMD_Command_Line_Development_Code_Programming.png'
    ),
    WHILE_LOOP: pixelIcon('Arrows_Media_Controls_Loop_Reload_Refresh.png'),
    IF_CONDITION: pixelIcon('Software_Signs_Checkmark_Checkbox_Ticked_Todo.png'),
    VARIABLE: pixelIcon('Software_Bytecode_1010_Ones_Zeroes_Programming.png'),
    AI_ASSIST: pixelIcon('Software_Speech_Bubble_Information_Guide_Tutorial.png'),
    FUNCTION: pixelIcon('Software_Hardware_Calculator_Maths.png'),
    ARRAY: pixelIcon('Software_Clipbaord_List_File_Copy_Paste.png'),
    OBJECT: pixelIcon('Tools_Crafting_Box_Crate_Shipping.png'),
    CLASS: pixelIcon('Software_File_Folder_Directory_Explorer.png'),
    RETURN: pixelIcon('Arrows_Go_Back_Return_Previous.png'),
    TRY_CATCH: pixelIcon('Software_Warning_Sign_Triangle_Exclaimation_Mark_Error.png'),
    SWITCH: pixelIcon('Controller_Buttons_Menu_Options_Settings.png'),
    BURST_TURRET: pixelIcon('Warfare_Weapon_Assault_Rifle_Submachine_Gun.png'),
    BLAST_TURRET: pixelIcon('Warfare_Medieval_Siege_Engine_Cannon_Gunpowder.png'),
    LOG: pixelIcon('Software_Hardware_Printer_Scanner_Fax_2.png'),
  },
  projectileSprites: {
    FOR_LOOP: pixelIcon('Arrows_Media_Controls_Loop_Reload_Refresh.png'),
    WHILE_LOOP: pixelIcon(
      'Software_Power_Electricity_Battery_Thunder_Lightning_Bolt_Zap_Danger.png'
    ),
    IF_CONDITION: pixelIcon('Software_Signs_Checkmark_Checkbox_Ticked_Todo.png'),
    VARIABLE: pixelIcon('Software_Bytecode_1010_Ones_Zeroes_Programming.png'),
    AI_ASSIST: pixelIcon('Software_Speech_Bubble_Information_Guide_Tutorial.png'),
    FUNCTION: pixelIcon('Software_Hardware_Calculator_Maths.png'),
    ARRAY: pixelIcon('Software_Clipbaord_List_File_Copy_Paste.png'),
    OBJECT: pixelIcon('Software_File_Folder_Directory_Explorer.png'),
    RETURN: pixelIcon('Arrows_Go_Back_Return_Previous.png'),
    TRY_CATCH: pixelIcon('Software_Warning_Sign_Triangle_Exclaimation_Mark_Error.png'),
    SWITCH: pixelIcon('Controller_Buttons_Menu_Options_Settings.png'),
    BURST_TURRET: pixelIcon('Warfare_Ammo_Bullet_Assault_Rifle.png'),
    BLAST_TURRET: pixelIcon('Warfare_Rocket_Missile_Bomb.png'),
    LOG: pixelIcon('Software_Hardware_Printer_Scanner_Fax_2.png'),
  },
};

export const RETRO_DESKTOP_ENEMY_PACK = {
  id: 'retro-desktop-shell',
  name: 'Retro Desktop Shell',
  enemyBodyColor: '#39463D',
  enemyHighlightColor: '#E7C96B',
  enemySprites: {
    basic: pixelIcon('Software_Warning_Sign_Circle_Crossout_Error_Bug_Crash.png'),
    edge: pixelIcon('Warfare_Ammo_Bullet_Assault_Rifle.png'),
    complex: pixelIcon('RPG_Creature_Archetypes_Robot_Mechanical.png'),
    timeLimit: pixelIcon('Boardgames_Chess_Clock_Timer.png'),
    spaceComplex: pixelIcon('Travel_Planet_Ring_Space_2.png'),
    hijacker: pixelIcon('Software_Link_Chain_Shortcut_Combo.png'),
    buffer: pixelIcon('Software_Harware_RAM_Stick_Memory.png'),
    pathShaper: pixelIcon('Travel_Roadway_Turn_Corner_Curve.png'),
  },
};

export const RETRO_DESKTOP_DAMAGE_TEXT_PACK = {
  id: 'retro-arcade',
  name: 'Retro Arcade',
};

export const RETRO_DESKTOP_DEATH_FX_PACK = {
  id: 'pixel-burst',
  name: 'Pixel Burst',
};

export const RETRO_DESKTOP_SHELL_COSMETICS = {
  pathGradientMode: 'minesweeper-trace',
  tdAttackFxMode: 'data-stream',
  mapTheme: RETRO_DESKTOP_MAP_THEME,
  towerPack: RETRO_DESKTOP_TOWER_PACK,
  enemyPack: RETRO_DESKTOP_ENEMY_PACK,
  damageTextPack: RETRO_DESKTOP_DAMAGE_TEXT_PACK,
  deathFxPack: RETRO_DESKTOP_DEATH_FX_PACK,
  lightningInternalMode: null,
  lightningColor: '#FDE047',
  lightningGlow: '#FEF08A',
};

export function getEmbeddedShellCosmetics(shellTheme = 'default') {
  if (shellTheme === 'retro-desktop') {
    return RETRO_DESKTOP_SHELL_COSMETICS;
  }

  return null;
}
