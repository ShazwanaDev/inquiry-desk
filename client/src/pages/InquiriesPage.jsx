import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_LABELS } from '../statuses.js';
import { formatDateTime } from '../format.js';

export default function InquiriesPage() {
  const { user } = useAuth();

  // Filters are stored in the URL: /inquiries?status=new&q=kamal
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const q = searchParams.get('q') ?? '';

  const [searchText, setSearchText] = useState(q); // what's typed in the box
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0); // bump to re-fetch ("Try again")

  // Load the list whenever the filters change (or "Try again" is clicked)
  useEffect(() => {
    let ignore = false; // becomes true if a newer request replaces this one

    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const query = params.toString();

    api(`/inquiries${query ? `?${query}` : ''}`)
      .then((data) => {
        if (!ignore) setInquiries(data.inquiries);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true; // "cleanup": runs before the next request starts
    };
  }, [status, q, reloadCount]);

  // Change one or more filters in the URL; empty values are removed
  function updateFilters(changes) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    setSearchParams(params);
  }

  function handleSearch(event) {
    event.preventDefault();
    updateFilters({ q: searchText.trim() });
  }

  function clearFilters() {
    setSearchText('');
    setSearchParams({});
  }

  const hasFilters = Boolean(status || q);

  // Decide which of the 4 states to show
  let content;
  if (loading) {
    content = <p className="page-status" role="status">Loading inquiries…</p>;
  } else if (error) {
    content = (
      <div className="alert alert-error state-box" role="alert">
        <p>Couldn’t load inquiries. {error}</p>
        <button className="btn" type="button" onClick={() => setReloadCount((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  } else if (inquiries.length === 0 && hasFilters) {
    content = (
      <div className="empty-state">
        <p>No inquiries match your search or filter.</p>
        <button className="btn" type="button" onClick={clearFilters}>Clear filters</button>
      </div>
    );
  } else if (inquiries.length === 0) {
    content = (
      <div className="empty-state">
        <p>No inquiries yet.</p>
        <Link to="/inquiries/new" className="btn btn-primary">Record the first inquiry</Link>
      </div>
    );
  } else {
    content = (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Customer</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <td>
                  <Link to={`/inquiries/${inquiry.id}`}>{inquiry.subject}</Link>
                </td>
                <td>
                  {inquiry.customerName}
                  <div className="muted small">{inquiry.contact}</div>
                </td>
                <td><StatusBadge status={inquiry.status} /></td>
                <td>{inquiry.ownerName}</td>
                <td>{formatDateTime(inquiry.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Inquiries</h1>
          <p className="muted">
            {user.role === 'manager' ? 'All inquiries across the team.' : 'Inquiries you are handling.'}
          </p>
        </div>
        <Link to="/inquiries/new" className="btn btn-primary">New inquiry</Link>
      </div>

      <div className="filters">
        <form role="search" className="search-form" onSubmit={handleSearch}>
          <label htmlFor="search" className="visually-hidden">Search inquiries</label>
          <input
            id="search"
            type="search"
            placeholder="Search name, contact or subject"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button className="btn" type="submit">Search</button>
        </form>

        <label className="status-filter">
          <span>Status</span>
          <select value={status} onChange={(e) => updateFilters({ status: e.target.value })}>
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {content}
    </section>
  );
}