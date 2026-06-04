import { m } from './paraglide/messages';

/**
 * Formats the time difference between two dates so that it can be rendered in the UI.
 */
export function duration(date1: Date, date2: Date = new Date(), countdownStyle: 'danger' | 'none' = 'none'): string {
  let interval = Math.abs(date1.getTime() - date2.getTime());
  const days = Math.floor(interval / 86_400_000);
  interval -= days * 86_400_000;
  const hours = Math.floor(interval / 3_600_000);
  interval -= hours * 3_600_000;
  const minutes = Math.floor(interval / 60_000);
  interval -= minutes * 60_000;
  const seconds = Math.floor(interval / 1_000);
  let format = hours === 0 && countdownStyle === 'danger' ? '<strong class="danger">' : '';
  if (days > 0) {
    format += m.days({ count: days });
  }
  if (hours > 0) {
    if (days > 0) format += ', ';
    format += m.hours({ count: hours });
  }
  if (hours < 3 && days === 0) {
    if (hours > 0) format += ', ';
    format += m.minutes({ count: minutes });
  }
  if (hours === 0 && days === 0) {
    format += ', ' + m.seconds({ count: seconds });
    if (countdownStyle === 'danger') {
      format += '</strong>';
    }
  }
  return format;
}

/** Displays date and time limiting the precision to minutes. */
export function dateTimeMedium(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/** Displays year, month, day. */
export function fullDate(date: Date): string {
  return date.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
}
