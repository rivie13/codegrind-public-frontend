export const getDifficultyColor = (difficulty) => {
  switch (difficulty.toUpperCase()) {
    case 'EASY':
      return '#00FF8C';
    case 'MEDIUM':
      return '#FFCC00';
    case 'HARD':
      return '#FF0000';
    default:
      return 'gray.400';
  }
};

export const getDifficultyShadow = (difficulty) => {
  switch (difficulty.toUpperCase()) {
    case 'EASY':
      return '0 0 5px rgba(0, 255, 140, 0.3)';
    case 'MEDIUM':
      return '0 0 5px rgba(255, 204, 0, 0.3)';
    case 'HARD':
      return '0 0 5px rgba(255, 0, 0, 0.3)';
    default:
      return 'none';
  }
};
