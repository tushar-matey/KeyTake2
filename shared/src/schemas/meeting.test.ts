import { describe, it, expect } from 'vitest';
import { meetingStatusSchema } from './meeting';

describe('meetingStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(meetingStatusSchema.parse('uploaded')).toBe('uploaded');
    expect(meetingStatusSchema.parse('processing')).toBe('processing');
    expect(meetingStatusSchema.parse('ready')).toBe('ready');
    expect(meetingStatusSchema.parse('failed')).toBe('failed');
  });

  it('rejects invalid statuses', () => {
    expect(() => meetingStatusSchema.parse('invalid')).toThrow();
  });
});
