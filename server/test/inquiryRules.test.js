import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canChangeStatus } from '../src/inquiryRules.js';

test('allows the normal flow and reopening', () => {
  assert.equal(canChangeStatus('new', 'in_progress'), true);
  assert.equal(canChangeStatus('in_progress', 'resolved'), true);
  assert.equal(canChangeStatus('resolved', 'in_progress'), true); // reopen
});

test('blocks skipping steps, going back to New, and unknown statuses', () => {
  assert.equal(canChangeStatus('new', 'resolved'), false);      // must be worked on first
  assert.equal(canChangeStatus('in_progress', 'new'), false);
  assert.equal(canChangeStatus('resolved', 'new'), false);
  assert.equal(canChangeStatus('new', 'new'), false);           // no change
  assert.equal(canChangeStatus('banana', 'new'), false);        // nonsense input
});