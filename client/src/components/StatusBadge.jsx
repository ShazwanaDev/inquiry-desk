import { STATUS_LABELS } from '../statuses.js';

// A coloured label so staff can spot the status at a glance
export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}