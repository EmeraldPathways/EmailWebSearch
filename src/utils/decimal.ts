import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculates engagement rate as (likes + comments) / followers.
 * Returns "0" if followers is zero to avoid division by zero.
 */
export function calcEngagementRate(
  likes: number,
  comments: number,
  followers: number
): string {
  if (followers === 0) return '0';
  return new Decimal(likes)
    .plus(new Decimal(comments))
    .dividedBy(new Decimal(followers))
    .toDecimalPlaces(4)
    .toString();
}

/**
 * Computes the arithmetic average of an array of numbers.
 * Returns "0" for an empty array.
 */
export function avgOf(values: number[]): string {
  if (values.length === 0) return '0';
  const sum = values.reduce((acc, v) => acc.plus(new Decimal(v)), new Decimal(0));
  return sum.dividedBy(new Decimal(values.length)).toFixed(2);
}

/**
 * Formats a number as a string-encoded decimal for API responses.
 */
export function toDecimalString(value: number, places: number = 2): string {
  return new Decimal(value).toFixed(places);
}
