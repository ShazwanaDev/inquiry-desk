import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api.js';
import TextField from '../components/TextField.jsx';
import { validateInquiry } from '../inquiryValidation.js';

const EMPTY_FORM = { customerName: '', contact: '', subject: '', description: '' };

export default function NewInquiryPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});       // one message per field
  const [formError, setFormError] = useState(''); // message for the whole form
  const [submitting, setSubmitting] = useState(false);

  // One change handler for all fields, using the input's "name"
  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined })); // clear while fixing
  }

  function showFieldErrors(fieldErrors) {
    setErrors(fieldErrors);
    const firstField = Object.keys(fieldErrors)[0];
    document.getElementById(firstField)?.focus(); // jump to the first problem
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return; // ignore double clicks
    setFormError('');

    // Layer 1: instant check in the browser
    const clientErrors = validateInquiry(values);
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const data = await api('/inquiries', { method: 'POST', body: values });
      navigate(`/inquiries/${data.inquiry.id}`, { state: { message: 'Inquiry recorded.' } });
    } catch (err) {
      // Layer 2: the server's answer
      if (err.status === 400 && err.details?.fields) {
        showFieldErrors(err.details.fields);
      } else {
        setFormError(err.message); // e.g. duplicate (409) or server down
      }
      setSubmitting(false);
    }
  }

  return (
    <section className="narrow">
      <Link to="/inquiries" className="back-link">← Back to inquiries</Link>
      <h1>New inquiry</h1>
      <p className="muted">Record a customer request so the team can follow it up.</p>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        {formError && <p className="alert alert-error" role="alert">{formError}</p>}

        <TextField id="customerName" label="Customer name" value={values.customerName}
          onChange={handleChange} error={errors.customerName} maxLength={100} autoComplete="off" />

        <TextField id="contact" label="Email or phone" hint="e.g. name@example.com or 0771234567"
          value={values.contact} onChange={handleChange} error={errors.contact} maxLength={120}
          autoComplete="off" />

        <TextField id="subject" label="Subject" value={values.subject}
          onChange={handleChange} error={errors.subject} maxLength={150} />

        <TextField id="description" label="Description" multiline rows={5} value={values.description}
          onChange={handleChange} error={errors.description} maxLength={2000} />

        <div className="form-actions">
          <Link to="/inquiries" className="btn">Cancel</Link>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save inquiry'}
          </button>
        </div>
      </form>
    </section>
  );
}