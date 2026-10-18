const DAY_MS = 86_400_000;

/** Whole UTC days since 1970-01-01. The site's "day" is the UTC day. */
export function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(utcDayNumber(date) * DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** ISO date (YYYY-MM-DD) of the UTC day. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
