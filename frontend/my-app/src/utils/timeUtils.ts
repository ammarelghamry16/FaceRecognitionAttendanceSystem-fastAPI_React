/**
 * Time Utilities - Relative time formatting
 */

/**
 * Get relative time string from a date
 * @param date - Date to format
 * @returns Human-readable relative time string (e.g., "2 min ago", "1 hour ago")
 */
export function getRelativeTime(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 10) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds} sec ago`;
    if (diffMinutes === 1) return '1 min ago';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;

    return targetDate.toLocaleDateString();
}

/**
 * Get the appropriate update interval for relative time based on how old the date is
 * @param date - Date to check
 * @returns Interval in milliseconds for updating the relative time
 */
export function getUpdateInterval(date: Date | string): number {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    // Update every 10 seconds for very recent items
    if (diffMinutes < 1) return 10000;
    // Update every minute for items less than an hour old
    if (diffMinutes < 60) return 60000;
    // Update every 5 minutes for items less than a day old
    if (diffMinutes < 1440) return 300000;
    // Update every hour for older items
    return 3600000;
}
