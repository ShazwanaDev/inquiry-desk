// Same rules as the server (server/src/validation.js), for instant feedback.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;

export function validateInquiry(values) {
  const errors = {};
  const customerName = values.customerName.trim();
  const contact = values.contact.trim();
  const subject = values.subject.trim();
  const description = values.description.trim();

  if (!customerName) errors.customerName = 'Customer name is required';

  if (!contact) errors.contact = 'Contact is required';
  else if (!EMAIL_PATTERN.test(contact) && !PHONE_PATTERN.test(contact)) {
    errors.contact = 'Enter a valid email address or phone number';
  }

  if (!subject) errors.subject = 'Subject is required';
  if (!description) errors.description = 'Description is required';

  return errors; // {} means "all good"
}