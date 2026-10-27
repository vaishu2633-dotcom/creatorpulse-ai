/**
 * CreatorPulse AI - Time Formatting Utilities
 * Standardizes time displays across all features and eliminates "17:00 PM" bugs.
 */

/**
 * Formats an hour integer (0-23) into clean 12-hour format ("5:00 PM").
 */
export function formatTime12h(hour, minute = 0) {
  const h = Number(hour) || 0;
  const m = String(minute).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m} ${period}`;
}

/**
 * Formats an hour integer (0-23) into 24-hour format ("17:00").
 */
export function formatTime24h(hour, minute = 0) {
  const h = String(Number(hour) || 0).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Returns options for hour selectors (0 to 23).
 */
export function getHourOptions() {
  return Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: formatTime12h(i)
  }));
}

/**
 * Formats an ISO string cleanly into readable time and date.
 */
export function formatIsoDateTime(isoStr) {
  if (!isoStr) return 'Just now';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const timePart = formatTime12h(hours, minutes);
    return `${datePart} at ${timePart}`;
  } catch {
    return isoStr;
  }
}
