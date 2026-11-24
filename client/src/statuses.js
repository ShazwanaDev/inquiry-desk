export const STATUS_LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};
// Which buttons to show for each status.
// This is only for the UI: the SERVER still checks every change.
export const STATUS_ACTIONS = {
  new: [{ to: 'in_progress', label: 'Start working' }],
  in_progress: [{ to: 'resolved', label: 'Mark as resolved' }],
  resolved: [{ to: 'in_progress', label: 'Reopen' }],
};