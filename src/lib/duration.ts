/** Whole calendar months from `startDate` to `endDate`, ignoring the day of the month. */
export function monthsBetween(startDate: Date, endDate: Date): number {
    return (
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    );
}

/**
 * Compact duration such as "2 yrs 3 mo", "1 yr" or "5 mo". Returns an empty string when the
 * range is shorter than a month (or reversed), so callers choose their own fallback.
 */
export function formatDuration(startDate: Date, endDate: Date): string {
    const totalMonths = monthsBetween(startDate, endDate);
    if (totalMonths <= 0) return '';
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} yr${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo`);
    return parts.join(' ');
}
