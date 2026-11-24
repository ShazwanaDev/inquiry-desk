import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import NewInquiryPage from './NewInquiryPage.jsx';
import { api, ApiError } from '../api.js';

// Replace the real api() with a fake we control. Keep everything else (ApiError) real.
vi.mock('../api.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, api: vi.fn() };
});

// The page uses <Link> and navigate(), so it needs a router around it
function renderPage() {
  render(
    <MemoryRouter>
      <NewInquiryPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.mockReset(); // forget calls from the previous test
});

it('shows field errors and does not call the API when required fields are missing', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole('button', { name: 'Save inquiry' }));

  expect(screen.getByText('Customer name is required')).toBeInTheDocument();
  expect(screen.getByText('Contact is required')).toBeInTheDocument();
  expect(screen.getByText('Subject is required')).toBeInTheDocument();
  expect(screen.getByText('Description is required')).toBeInTheDocument();

  const nameInput = screen.getByLabelText('Customer name');
  expect(nameInput).toHaveAttribute('aria-invalid', 'true'); // marked invalid for screen readers
  expect(nameInput).toHaveFocus();                           // cursor jumped to the first problem

  expect(api).not.toHaveBeenCalled(); // nothing was sent to the server
});

it('shows the server message when the inquiry is a duplicate, and lets the user try again', async () => {
  // Pretend the server answered 409 Conflict
  api.mockRejectedValue(
    new ApiError(409, 'An open inquiry with this contact and subject already exists', { code: 'DUPLICATE' })
  );
  const user = userEvent.setup();
  renderPage();

  await user.type(screen.getByLabelText('Customer name'), 'Kamal Jayasinghe');
  await user.type(screen.getByLabelText('Email or phone'), 'kamal@example.com');
  await user.type(screen.getByLabelText('Subject'), 'Delivery delay');
  await user.type(screen.getByLabelText('Description'), 'Still waiting for order 1042.');
  await user.click(screen.getByRole('button', { name: 'Save inquiry' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('already exists'); // message shown
  expect(api).toHaveBeenCalledTimes(1);                                        // sent once
  expect(screen.getByRole('button', { name: 'Save inquiry' })).toBeEnabled();  // can try again
});