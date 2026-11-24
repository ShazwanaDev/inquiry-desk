import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_ACTIONS, STATUS_LABELS } from '../statuses.js';
import { formatDateTime } from '../format.js';

export default function InquiryDetailPage() {
  const { id } = useParams(); // the ":id" from the URL
  const location = useLocation();

  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);
  // A message after an action: { type: 'success' | 'warning' | 'error', text }
  const [notice, setNotice] = useState(
    location.state?.message ? { type: 'success', text: location.state.message } : null
  );

  // Same "request key" idea as the list page
  const requestKey = `${id}|${reloadCount}`;
  const [result, setResult] = useState({ key: null, inquiry: null, error: null });
  const loading = result.key !== requestKey;
  const { inquiry, error: loadError } = result;

  // Helpers so the rest of the page reads naturally
  const setInquiry = (next) => setResult((prev) => ({ ...prev, inquiry: next }));
  const setLoadError = (err) => setResult((prev) => ({ ...prev, error: err }));

  useEffect(() => {
    let ignore = false;

    api(`/inquiries/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!ignore) setResult({ key: requestKey, inquiry: data.inquiry, error: null });
      })
      .catch((err) => {
        // keep the old inquiry on screen if a Refresh fails; the error decides what shows
        if (!ignore) setResult((prev) => ({ key: requestKey, inquiry: prev.inquiry, error: err }));
      });

    return () => {
      ignore = true;
    };
  }, [requestKey, id]);

  async function changeStatus(newStatus) {
    setSaving(true);
    setNotice(null);
    try {
      const data = await api(`/inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        body: { status: newStatus, version: inquiry.version }, // send the version we are looking at
      });
      setInquiry(data.inquiry);
      setNotice({ type: 'success', text: `Status changed to ${STATUS_LABELS[data.inquiry.status]}.` });
    } catch (err) {
      if (err.status === 409 && err.details?.code === 'STALE' && err.details.inquiry) {
        // Someone else changed it: show the latest version, don't overwrite
        setInquiry(err.details.inquiry);
        setNotice({ type: 'warning', text: `${err.message} Your change was not saved.` });
      } else if (err.status === 404) {
        setLoadError(err); // it was removed, or access was lost
      } else {
        setNotice({ type: 'error', text: err.message }); // e.g. 422 not allowed, server down
      }
    } finally {
      setSaving(false);
    }
  }

  // Show the loading screen on first load, or when switching to a different inquiry
  if (loading && (!inquiry || String(inquiry.id) !== id)) {
    return <p className="page-status" role="status">Loading inquiry…</p>;
  }

  if (loadError) {
    const notFound = loadError.status === 404;
    const badLink = loadError.status === 400;
    return (
      <section className="narrow">
        <div className="empty-state">
          <h1>{notFound ? 'Inquiry not found' : badLink ? 'This link is not valid' : 'Couldn’t load this inquiry'}</h1>
          <p className="muted">
            {notFound
              ? 'It may have been removed, or you don’t have access to it.'
              : badLink
                ? 'Check the link and try again.'
                : loadError.message}
          </p>
          <div className="form-actions">
            {!notFound && !badLink && (
              <button className="btn" type="button" onClick={() => setReloadCount((n) => n + 1)}>Try again</button>
            )}
            <Link to="/inquiries" className="btn btn-primary">Back to inquiries</Link>
          </div>
        </div>
      </section>
    );
  }

  const actions = STATUS_ACTIONS[inquiry.status] ?? [];

  return (
    <section className="narrow">
      <Link to="/inquiries" className="back-link">← Back to inquiries</Link>

      <div className="detail-header">
        <div>
          <p className="muted small">Inquiry #{inquiry.id}</p>
          <h1>{inquiry.subject}</h1>
        </div>
        <StatusBadge status={inquiry.status} />
      </div>

      {notice && (
        <p className={`alert alert-${notice.type}`} role={notice.type === 'success' ? 'status' : 'alert'}>
          {notice.text}
        </p>
      )}

      <div className="card">
        <dl className="details">
          <dt>Customer</dt><dd>{inquiry.customerName}</dd>
          <dt>Contact</dt><dd>{inquiry.contact}</dd>
          <dt>Owner</dt><dd>{inquiry.ownerName}</dd>
          <dt>Created</dt><dd>{formatDateTime(inquiry.createdAt)}</dd>
          <dt>Last updated</dt><dd>{formatDateTime(inquiry.updatedAt)}</dd>
        </dl>
        <h2 className="section-title">Description</h2>
        <p className="description">{inquiry.description}</p>
      </div>

      <div className="card status-actions">
        <h2 className="section-title">Update status</h2>
        <div className="form-actions start">
          {actions.map((action) => (
            <button key={action.to} className="btn btn-primary" type="button"
              disabled={saving} onClick={() => changeStatus(action.to)}>
              {saving ? 'Saving…' : action.label}
            </button>
          ))}
          <button className="btn" type="button" disabled={saving || loading}
            onClick={() => setReloadCount((n) => n + 1)}>
            Refresh
          </button>
        </div>
      </div>
    </section>
  );
}