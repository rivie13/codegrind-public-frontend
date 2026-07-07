export const getWebStorage = (storageKey) => {
  if (typeof window === 'undefined') return null;

  try {
    const storage = window[storageKey];
    return storage && typeof storage.getItem === 'function' ? storage : null;
  } catch {
    return null;
  }
};

export const readStorage = (storageKey, itemKey) =>
  getWebStorage(storageKey)?.getItem(itemKey) ?? null;

export const writeStorage = (storageKey, itemKey, value) => {
  const storage = getWebStorage(storageKey);
  if (!storage || typeof storage.setItem !== 'function') return;
  storage.setItem(itemKey, value);
};

export const removeStorageItem = (storageKey, itemKey) => {
  const storage = getWebStorage(storageKey);
  if (!storage || typeof storage.removeItem !== 'function') return;
  storage.removeItem(itemKey);
};
