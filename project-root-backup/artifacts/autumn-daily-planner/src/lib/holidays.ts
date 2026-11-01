// Gentle seasonal and holiday labels for the calendar. Dates are plain facts, not entries,
// so they never count as "writing" in the planner.
export const HOLIDAYS: Record<string, { label: string; short: string }> = {
  '2026-11-01': { label: 'Daylight saving time ends', short: 'DST ends' },
  '2026-11-03': { label: 'Election Day', short: 'Election' },
  '2026-11-08': { label: 'Diwali', short: 'Diwali' },
  '2026-11-11': { label: 'Veterans Day', short: 'Veterans' },
  '2026-11-26': { label: 'Thanksgiving', short: 'Thanksgiving' },
  '2026-12-04': { label: 'Hanukkah begins at sundown', short: 'Hanukkah' },
  '2026-12-21': { label: 'Winter solstice', short: 'Solstice' },
  '2026-12-24': { label: 'Christmas Eve', short: 'Xmas Eve' },
  '2026-12-25': { label: 'Christmas Day', short: 'Christmas' },
  '2026-12-26': { label: 'Kwanzaa begins', short: 'Kwanzaa' },
  '2026-12-31': { label: "New Year's Eve", short: 'NYE' },
  '2027-01-01': { label: "New Year's Day", short: 'New Year' },
  '2027-01-18': { label: 'Martin Luther King Jr. Day', short: 'MLK Day' },
};
