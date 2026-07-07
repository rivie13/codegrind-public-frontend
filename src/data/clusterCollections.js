/**
 * clusterCollections.js — Registry of cluster collections.
 *
 * CodeGrind Core is based on our expanded interview-practice set, with the beginner-track
 * prepended as the free-trial entry point.
 *
 * CodeGrind Blind 75, CodeGrind 150, and CodeGrind 250 are also available as filtered
 * views that reuse the same topic clusters with subset slug lists.
 */

import { INTERVIEW_CHALLENGE_SETS } from './interviewChallengeSets';
import interviewTopicClusters, { CLUSTER_DIFFICULTY } from './interviewTopicClusters';
import codegrind250Clusters from './codegrind250Clusters';

export { CLUSTER_DIFFICULTY };

/** The single cluster that guests can access during the free trial */
export const TRIAL_CLUSTER_ID = 'beginner-track';

const beginnerTrack = interviewTopicClusters.find((c) => c.id === 'beginner-track');

/* Strip cg250- prefix from cluster IDs for reuse across collections */
const topicClusters = codegrind250Clusters.map((c) => ({
  ...c,
  id: c.id.replace(/^cg250-/, ''),
}));

/* CodeGrind Core: beginner-track + all topic clusters */
const coreClusters = [beginnerTrack, ...topicClusters];

/**
 * Build a topic-filtered collection from a challenge set.
 * Keeps only slugs present in the set; drops clusters that end up empty.
 */
function buildFilteredCollection(setId, displayName, shortName, slugList) {
  const slugSet = new Set(slugList);
  const filtered = topicClusters
    .map((c) => ({
      ...c,
      slugs: c.slugs.filter((s) => slugSet.has(s)),
    }))
    .filter((c) => c.slugs.length > 0);

  const total = filtered.reduce((sum, c) => sum + c.slugs.length, 0);

  return {
    id: setId,
    name: displayName,
    shortName,
    description: `${total} problems across ${filtered.length} topic clusters.`,
    clusters: filtered,
  };
}

/* Pull slug lists from interviewChallengeSets.js */
const blind75 = INTERVIEW_CHALLENGE_SETS.find((s) => s.id === 'codegrind-blind-75');
const codegrind150Set = INTERVIEW_CHALLENGE_SETS.find((s) => s.id === 'codegrind-150');
const codegrind250Set = INTERVIEW_CHALLENGE_SETS.find((s) => s.id === 'codegrind-250');

export const CLUSTER_COLLECTIONS = [
  {
    id: 'codegrind-core',
    name: 'CodeGrind Core',
    shortName: 'Core',
    description:
      '18 algorithm clusters · 237 problems · 3 tiers for structured interview practice.',
    clusters: coreClusters,
  },
  ...(blind75?.enabled
    ? [buildFilteredCollection('codegrind-blind-75', 'CodeGrind Blind 75', 'CG75', blind75.slugs)]
    : []),
  ...(codegrind150Set?.enabled
    ? [buildFilteredCollection('codegrind-150', 'CodeGrind 150', 'CG150', codegrind150Set.slugs)]
    : []),
  ...(codegrind250Set?.enabled
    ? [buildFilteredCollection('codegrind-250', 'CodeGrind 250', 'CG250', codegrind250Set.slugs)]
    : []),
];

/** Flat lookup of every cluster across all collections */
export const ALL_CLUSTERS = CLUSTER_COLLECTIONS.flatMap((c) => c.clusters);

export const DEFAULT_COLLECTION_ID = 'codegrind-core';

export default CLUSTER_COLLECTIONS;
