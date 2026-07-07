export const useProfileStats = () => {
  const calculateSuccessRate = (submissions) => {
    if (!submissions || submissions.length === 0) return 0;
    const acceptedSubmissions = submissions.filter(sub => sub.status === 'accepted');
    return Math.round((acceptedSubmissions.length / submissions.length) * 100);
  };

  const calculateStreak = (submissions) => {
    if (!submissions || submissions.length === 0) return 0;
    
    // Sort submissions by date
    const sortedSubmissions = [...submissions].sort((a, b) => 
        new Date(b.submission_date) - new Date(a.submission_date)
    );

    // Get unique dates with accepted submissions
    const uniqueDates = new Set(
        sortedSubmissions
            .filter(sub => sub.status === 'accepted')
            .map(sub => {
                const date = new Date(sub.submission_date);
                return date.toDateString();
            })
    );

    // Convert to array and sort
    const dates = Array.from(uniqueDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => b - a);

    if (dates.length === 0) return 0;

    // Check if the streak is still active (less than 24 hours since last submission)
    const mostRecentDate = dates[0];
    const now = new Date();
    const timeDiff = now - mostRecentDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff > 1) return 0;

    // Calculate streak from most recent submission
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const currentDate = dates[i];
        const previousDate = dates[i - 1];
        const dayDifference = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (dayDifference === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
  };

  return { calculateSuccessRate, calculateStreak };
};

export default useProfileStats; 