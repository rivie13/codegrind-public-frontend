const toSolvedSet = (solvedSlugs) => {
  if (solvedSlugs instanceof Set) return solvedSlugs;
  if (!Array.isArray(solvedSlugs)) return new Set();
  return new Set(solvedSlugs.filter(Boolean));
};

export const getContiguousSolvedPrefixLength = (orderedSlugs, solvedSlugs) => {
  if (!Array.isArray(orderedSlugs) || orderedSlugs.length === 0) return 0;
  const solvedSet = toSolvedSet(solvedSlugs);
  let solvedPrefixLength = 0;

  for (const slug of orderedSlugs) {
    if (!slug || !solvedSet.has(slug)) break;
    solvedPrefixLength += 1;
  }

  return solvedPrefixLength;
};

export const getUnlockedOrderedSlugs = (orderedSlugs, solvedSlugs) => {
  if (!Array.isArray(orderedSlugs) || orderedSlugs.length === 0) return [];
  const solvedPrefixLength = getContiguousSolvedPrefixLength(orderedSlugs, solvedSlugs);
  const unlockedCount = Math.min(orderedSlugs.length, solvedPrefixLength + 1);
  return orderedSlugs.slice(0, unlockedCount);
};

export const isOrderedSlugUnlocked = (orderedSlugs, slug, solvedSlugs) => {
  if (!slug) return false;
  return getUnlockedOrderedSlugs(orderedSlugs, solvedSlugs).includes(slug);
};
