import { analyzeCode } from '../../../utils/code/codeParser';
import { TOWER_TYPES } from '../../../game-engine-v2';

export const getTowerKeyForConcept = (conceptKey) => {
  if (!conceptKey) return null;
  const entries = Object.entries(TOWER_TYPES);
  for (const [key, value] of entries) {
    if (value?.conceptKey === conceptKey) {
      return key;
    }
  }
  return null;
};

export const getDerivedTowerType = (snippetLine, languageKey) => {
  if (!snippetLine) return null;
  const concepts = analyzeCode(snippetLine, languageKey);
  const priority = [
    'FUNCTION',
    'FOR_LOOP',
    'WHILE_LOOP',
    'IF_CONDITION',
    'SWITCH',
    'TRY_CATCH',
    'RETURN_STATEMENT',
    'ARRAY',
    'OBJECT',
    'VARIABLE',
    'LOG',
  ];
  const matched = priority.find((key) => concepts[key]);
  if (!matched) return null;
  const towerKey = getTowerKeyForConcept(matched);
  return towerKey ? TOWER_TYPES[towerKey]?.type || null : null;
};
