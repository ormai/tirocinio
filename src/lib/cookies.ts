export const SESSION_COOKIE = 'session_id';
export const COLOR_SCHEME = 'color_scheme';
export const SIDEBAR_COLLAPSED = 'sidebar_collapsed';

/**
 * Coerces cookie to boolean.
 *
 * @params {string | undefined} the raw value of the cookie
 * @returns {boolean | null} the converted value of the cookie if any
 */
export function boolFromCookie(value?: string): boolean | null {
  if (value) {
    return value === 'true' || value === 'yes';
  }
  return null;
}
