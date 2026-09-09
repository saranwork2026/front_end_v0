/**
 * JWT token utility functions.
 * Platform-agnostic — no browser globals (atob, window) or Node globals (Buffer).
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Decodes a base64/base64url-encoded string to a UTF-8 string.
 * Handles base64url (- and _ chars) by converting to standard base64 first.
 */
function base64Decode(input: string): string {
  // Convert base64url to base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const pad = base64.length % 4;
  if (pad === 2) {
    base64 += '==';
  } else if (pad === 3) {
    base64 += '=';
  }

  const bytes: number[] = [];

  for (let i = 0; i < base64.length; i += 4) {
    const a = BASE64_CHARS.indexOf(base64[i]);
    const b = BASE64_CHARS.indexOf(base64[i + 1]);
    const c = BASE64_CHARS.indexOf(base64[i + 2]);
    const d = BASE64_CHARS.indexOf(base64[i + 3]);

    const triplet = (a << 18) | (b << 12) | (c << 6) | d;

    bytes.push((triplet >> 16) & 0xff);
    if (base64[i + 2] !== '=') {
      bytes.push((triplet >> 8) & 0xff);
    }
    if (base64[i + 3] !== '=') {
      bytes.push(triplet & 0xff);
    }
  }

  // Decode UTF-8 bytes to string
  let result = '';
  let j = 0;
  while (j < bytes.length) {
    const byte = bytes[j];
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
      j++;
    } else if ((byte & 0xe0) === 0xc0) {
      result += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[j + 1] & 0x3f));
      j += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      result += String.fromCharCode(
        ((byte & 0x0f) << 12) | ((bytes[j + 1] & 0x3f) << 6) | (bytes[j + 2] & 0x3f)
      );
      j += 3;
    } else {
      // 4-byte UTF-8 (surrogate pair)
      const codepoint =
        ((byte & 0x07) << 18) |
        ((bytes[j + 1] & 0x3f) << 12) |
        ((bytes[j + 2] & 0x3f) << 6) |
        (bytes[j + 3] & 0x3f);
      const adjusted = codepoint - 0x10000;
      result += String.fromCharCode(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
      j += 4;
    }
  }

  return result;
}

/**
 * Decodes a JWT payload (the second segment) without using any external library.
 * Splits the token by '.', takes index 1, base64url-decodes it, and parses as JSON.
 *
 * @param token - The JWT string
 * @returns The parsed payload as a record, or an empty object if decoding fails
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {};
    }

    const payload = parts[1];
    const decoded = base64Decode(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Returns the `exp` claim from a JWT as a Unix timestamp in seconds,
 * or null if the token cannot be parsed or the `exp` claim is absent.
 *
 * @param token - The JWT string
 * @returns The expiry timestamp in seconds, or null
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (typeof payload.exp === 'number') {
    return payload.exp;
  }
  return null;
}

/**
 * Returns true if the token expires within `thresholdSeconds` (default 60).
 * Returns true if the token is unparseable or missing an `exp` claim.
 *
 * @param token - The JWT string
 * @param thresholdSeconds - Number of seconds before expiry to consider "expiring soon" (default: 60)
 * @returns true if token is expiring soon or unparseable
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds: number = 60): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return (expiry - nowSeconds) < thresholdSeconds;
}
