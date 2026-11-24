// A label + input (or textarea) + error message, wired up for screen readers.
export default function TextField({ id, label, hint, error, multiline = false, ...inputProps }) {
  const InputTag = multiline ? 'textarea' : 'input';
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <span id={`${id}-hint`} className="muted small">{hint}</span>}
      <InputTag
        id={id}
        name={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {error && <span id={`${id}-error`} className="field-error">{error}</span>}
    </div>
  );
}