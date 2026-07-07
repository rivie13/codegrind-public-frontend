export const DIFFICULTY = {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD'
};

export const getDifficultyString = (difficulty) => {
    if (!difficulty) return null;
    
    // Handle the enum value from LeetCode API
    switch(difficulty.toUpperCase()) {
        case DIFFICULTY.EASY:
            return 'easy';
        case DIFFICULTY.MEDIUM:
            return 'medium';
        case DIFFICULTY.HARD:
            return 'hard';
        default:
            return null;
    }
}; 