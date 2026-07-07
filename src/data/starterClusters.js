/**
 * starterClusters.js — Beginner Demo Path, organised into small intro clusters.
 *
 * All 15 slugs verified present in the CodeGrind database.
 * Designed as a gentle on-ramp for brand-new users.
 * IDs are prefixed with `start-` to avoid collisions with other collections.
 */

import { CLUSTER_DIFFICULTY } from './interviewTopicClusters';

const starterClusters = [
  {
    id: 'start-fundamentals',
    title: 'Core Fundamentals',
    shortTitle: 'Basics',
    description: 'Your very first problems — hash maps, sorting, and array tricks.',
    difficulty: CLUSTER_DIFFICULTY.BEGINNER,
    accent: '#00FF8C',
    icon: '★',
    towerDefenseOnly: true,
    slugs: [
      'two-sum',
      'contains-duplicate',
      'valid-anagram',
      'best-time-to-buy-and-sell-stock',
      'maximum-subarray',
    ],
  },
  {
    id: 'start-patterns',
    title: 'Pattern Building',
    shortTitle: 'Patterns',
    description: 'Frequency maps, prefix tricks, and interval merging.',
    difficulty: CLUSTER_DIFFICULTY.BEGINNER,
    accent: '#00FFFF',
    icon: '⧫',
    towerDefenseOnly: true,
    slugs: [
      'group-anagrams',
      'top-k-frequent-elements',
      'product-of-array-except-self',
      'merge-intervals',
      'valid-parentheses',
    ],
  },
  {
    id: 'start-structures',
    title: 'Data Structures',
    shortTitle: 'Structs',
    description: 'Linked lists, trees, and graph traversals for the first time.',
    difficulty: CLUSTER_DIFFICULTY.BEGINNER,
    accent: '#C084FC',
    icon: '⬢',
    towerDefenseOnly: true,
    slugs: [
      'reverse-linked-list',
      'number-of-islands',
      'course-schedule',
      'binary-tree-level-order-traversal',
      'kth-smallest-element-in-a-bst',
    ],
  },
];

export default starterClusters;
