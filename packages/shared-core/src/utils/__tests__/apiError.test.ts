import { describe, it, expect } from 'vitest';
import { getApiError, getApiErrorMessage } from '../apiError';

describe('getApiError', () => {
  it('should extract the ApiError from an axios-shaped error', () => {
    const err = { response: { data: { errorCode: 'USER_NOT_FOUND', message: 'User not found' } } };
    expect(getApiError(err)).toEqual({ errorCode: 'USER_NOT_FOUND', message: 'User not found' });
  });

  it('should return undefined for an error without a response', () => {
    expect(getApiError(new Error('network'))).toBeUndefined();
  });

  it('should return undefined for a null/primitive error', () => {
    expect(getApiError(null)).toBeUndefined();
    expect(getApiError('boom')).toBeUndefined();
  });
});

describe('getApiErrorMessage', () => {
  it('should prefer a page-specific override keyed by errorCode', () => {
    const err = { response: { data: { errorCode: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } } };
    const msg = getApiErrorMessage(err, 'fallback', {
      INVALID_CREDENTIALS: 'Wrong mobile or password',
    });
    expect(msg).toBe('Wrong mobile or password');
  });

  it('should fall back to the backend message when no override matches', () => {
    const err = { response: { data: { errorCode: 'USER_BLOCKED', message: 'User account is blocked' } } };
    expect(getApiErrorMessage(err, 'fallback')).toBe('User account is blocked');
  });

  it('should use the provided fallback when the error has no recognizable shape', () => {
    expect(getApiErrorMessage(new Error('network'), 'Please try again')).toBe('Please try again');
  });

  it('should use the default fallback when none is provided', () => {
    expect(getApiErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
  });

  it('should fall back to the backend message when the errorCode has no override entry', () => {
    const err = { response: { data: { errorCode: 'OTHER_CODE', message: 'Backend message' } } };
    const msg = getApiErrorMessage(err, 'fallback', { SOME_OTHER: 'x' });
    expect(msg).toBe('Backend message');
  });
});
