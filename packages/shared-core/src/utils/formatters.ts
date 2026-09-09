/**
 * Formatting utility functions for display purposes.
 * Platform-agnostic — no browser globals.
 */

/**
 * Formats a number as Indian Rupee currency with Indian numbering system.
 * Example: 123456.7 → "₹1,23,456.70"
 *
 * @param amount - The numeric amount to format
 * @returns Formatted currency string with ₹ symbol and 2 decimal places
 */
export function formatCurrency(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian numbering: last 3 digits, then groups of 2
  let formatted: string;
  if (integerPart.length <= 3) {
    formatted = integerPart;
  } else {
    const lastThree = integerPart.slice(-3);
    const remaining = integerPart.slice(0, -3);

    // Group remaining digits in pairs from the right
    const pairs: string[] = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      const start = Math.max(0, i - 2);
      pairs.unshift(remaining.slice(start, i));
    }

    formatted = pairs.join(',') + ',' + lastThree;
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}₹${formatted}.${decimalPart}`;
}

/**
 * Converts an ISO date string to DD/MM/YYYY format.
 *
 * @param isoDateString - An ISO 8601 date string (e.g., "2024-03-15T10:30:00Z")
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDate(isoDateString: string): string {
  const date = new Date(isoDateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a wallet balance to always show exactly 2 decimal places.
 * Example: 1234.5 → "1234.50", 100 → "100.00"
 *
 * @param amount - The numeric balance
 * @returns String with exactly 2 decimal places
 */
export function formatWalletBalance(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Truncates text to a maximum number of characters, appending "..." if truncated.
 * Returns the original text if it's shorter than or equal to maxLength.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum number of characters before truncation
 * @returns The truncated text with "..." appended, or original if shorter
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
