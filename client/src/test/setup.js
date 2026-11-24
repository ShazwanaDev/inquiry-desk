import '@testing-library/jest-dom/vitest'; // adds toBeInTheDocument(), toHaveFocus()...
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Remove what each test drew, so tests don't affect each other
afterEach(() => cleanup());