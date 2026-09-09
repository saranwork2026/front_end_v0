import { describe, it, expect, vi, afterEach } from 'vitest';
import { decodeJwtPayload, getTokenExpiry, isTokenExpiringSoon } from '../token';

/**
 * Builds a fake JWT (header.payload.signature) with the given payload
 * object, base64url-encoding the payload the same way a real token would.
 */
function makeToken(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // base64url, no padding
  return `header.${base64}.signature`;
}

describe('decodeJwtPayload', () => {
  it('should decode a valid JWT payload segment to an object', () => {
    const token = makeToken({ sub: 'user-1', role: 'USER' });
    expect(decodeJwtPayload(token)).toEqual({ sub: 'user-1', role: 'USER' });
  });

  it('should return an empty object for a token without three segments', () => {
    expect(decodeJwtPayload('not-a-jwt')).toEqual({});
  });

  it('should return an empty object when the payload is not valid JSON', () => {
    expect(decodeJwtPayload('header.###.signature')).toEqual({});
  });
});

describe('getTokenExpiry', () => {
  it('should return the exp claim when present as a number', () => {
    const token = makeToken({ exp: 1_700_000_000 });
    expect(getTokenExpiry(token)).toBe(1_700_000_000);
  });

  it('should return null when the exp claim is absent', () => {
    const token = makeToken({ sub: 'user-1' });
    expect(getTokenExpiry(token)).toBeNull();
  });

  it('should return null for an unparseable token', () => {
    expect(getTokenExpiry('garbage')).toBeNull();
  });
});

describe('isTokenExpiringSoon', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false when the token expires well beyond the threshold', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = makeToken({ exp: nowSeconds + 3600 }); // 1 hour out

    expect(isTokenExpiringSoon(token)).toBe(false);
  });

  it('should return true when the token expires within the threshold', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = makeToken({ exp: nowSeconds + 30 }); // 30s out, under default 60s

    expect(isTokenExpiringSoon(token)).toBe(true);
  });

  it('should respect a custom threshold', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = makeToken({ exp: nowSeconds + 120 }); // 2 min out

    expect(isTokenExpiringSoon(token, 300)).toBe(true); // threshold 5 min
    expect(isTokenExpiringSoon(token, 60)).toBe(false); // threshold 1 min
  });

  it('should treat an unparseable token as expiring soon', () => {
    expect(isTokenExpiringSoon('garbage')).toBe(true);
  });
});
