/**
 * Formats a Date (or offset days from today) into local YYYY-MM-DD format.
 */
export function getLocalDateString(offsetDays = 0, baseDateStr = null) {
  const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  base.setDate(base.getDate() + offsetDays);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string into readable chip label (e.g. "Thu, 12 Nov").
 */
export function formatDateTabLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formats an ISO timestamp into 24-hour HH:MM time in local/IST display.
 */
export function formatClockTime(isoString) {
  if (!isoString) return '--:--';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formats duration in minutes as "Xh Ym".
 */
export function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
