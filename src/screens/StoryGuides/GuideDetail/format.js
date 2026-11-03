const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** ISO date -> "22 May 2026" (UTC, so it matches the website). Empty string if invalid. */
export const formatPublishedDate = value => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/** 20230 -> "20.2K", 1500000 -> "1.5M", 842 -> "842". */
export const formatCount = value => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  const short = (num, unit) => `${(Math.floor(num * 10) / 10).toString().replace(/\.0$/, '')}${unit}`;
  if (n >= 1000000) {
    return short(n / 1000000, 'M');
  }
  if (n >= 1000) {
    return short(n / 1000, 'K');
  }
  return String(Math.floor(n));
};
