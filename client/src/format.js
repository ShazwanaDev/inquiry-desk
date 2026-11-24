// "2026-11-24T10:30:00.000Z" -> "24 Nov 2026, 4:00 PM" (in the user's own timezone)
export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}