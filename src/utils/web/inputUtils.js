/**
 * Shared DOM input-type detection helpers.
 *
 * Consolidates the `isTextEntryTarget` function that was previously duplicated
 * in CityPhaserPreviewPage.jsx and CityMap.jsx.
 */

/**
 * Returns true if the given DOM element is a text-entry target that should
 * receive keyboard input instead of the game engine.
 *
 * Used to prevent city movement key handlers from intercepting typing
 * in input fields, textareas, selects, or contentEditable elements.
 *
 * @param {EventTarget|Element|null} target - The DOM element to check
 * @returns {boolean} True if the target is a text-entry element
 */
export const isTextEntryTarget = (target) => {
  const tagName = String(target?.tagName || '')
    .trim()
    .toLowerCase();

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    Boolean(target?.isContentEditable)
  );
};
