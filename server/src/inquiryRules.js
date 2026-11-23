export const STATUSES = ['new', 'in_progress', 'resolved'];

export const STATUS_LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// For each status: which statuses can it move TO?
const ALLOWED_CHANGES = {
  new: ['in_progress'],          // start working on it
  in_progress: ['resolved'],     // finish it
  resolved: ['in_progress'],     // reopen (customer came back)
};

export function canChangeStatus(from, to) {
  return ALLOWED_CHANGES[from]?.includes(to) ?? false;
}