import getAssetUrl from './assetUrl';

const TD_DEVICE_SHELL_ART_ROOT = '/city-v2/tiled/device-shell-art';
const TD_PIXEL_ICON_ROOT = `${TD_DEVICE_SHELL_ART_ROOT}/1-bit_Pixel_Icons/Sprites`;

export const RETRO_WINDOW_BUTTON_ASSET = getAssetUrl(
  `${TD_DEVICE_SHELL_ART_ROOT}/RetroWindowsGUI/Windows_Button.png`
);
export const RETRO_WINDOW_BUTTON_PRESSED_ASSET = getAssetUrl(
  `${TD_DEVICE_SHELL_ART_ROOT}/RetroWindowsGUI/Windows_Button_Pressed.png`
);
export const RETRO_DESKTOP_BADGE_ASSET = getAssetUrl(
  `${TD_PIXEL_ICON_ROOT}/Platforms_Windows_XP_Vista_7.png`
);
export const RETRO_WINDOW_BASE_ASSET = getAssetUrl(
  `${TD_DEVICE_SHELL_ART_ROOT}/RetroWindowsGUI/Window_Base.png`
);
export const RETRO_PROGRESS_FILL_ASSET = getAssetUrl(
  `${TD_DEVICE_SHELL_ART_ROOT}/RetroWindowsGUI/Windows_Progress_Fill.png`
);
export const RETRO_DEFENSE_MATRIX_ICON_ASSET = getAssetUrl(
  `${TD_PIXEL_ICON_ROOT}/RPG_Item_Stat_Shield_Defense_Armor.png`
);
export const RETRO_UTILITY_ICON_ASSET = getAssetUrl(
  `${TD_PIXEL_ICON_ROOT}/Tools_Crafting_Wrench.png`
);
export const RETRO_TUTORIAL_ICON_ASSET = getAssetUrl(
  `${TD_PIXEL_ICON_ROOT}/Software_Speech_Bubble_Information_Guide_Tutorial.png`
);
export const RETRO_PANEL_ICON_ASSETS = {
  game: getAssetUrl(`${TD_PIXEL_ICON_ROOT}/Software_Hardware_Monitor_Display_PC_Computer.png`),
  editor: getAssetUrl(`${TD_PIXEL_ICON_ROOT}/Software_Notepad_Wordpad_Text_Editor.png`),
  chat: RETRO_TUTORIAL_ICON_ASSET,
  problem: getAssetUrl(`${TD_PIXEL_ICON_ROOT}/Software_Pen_Paper_Notes_Edit_Text.png`),
};

export const getTowerDefensePixelIconAsset = (fileName) =>
  getAssetUrl(`${TD_PIXEL_ICON_ROOT}/${fileName}`);
