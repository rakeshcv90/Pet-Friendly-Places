// Version helpers for the store-update check. App versions look like "1.4", "1.4.2" or "v1.4.2".
// Anything that is not a version (an empty value, text) is treated as "unknown", never as old: a
// missing or broken setting must not lock users out of the app.

export const parseVersion = value => {
  const match = String(value ?? '')
    .trim()
    .replace(/^v/i, '')
    .match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
};

// -1, 0 or 1 like a sort comparator. 0 when either side is not a version.
export const compareVersions = (a, b) => {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) {
    return 0;
  }
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) {
      return left[i] > right[i] ? 1 : -1;
    }
  }
  return 0;
};

export const isVersionBelow = (version, minimum) => {
  if (!parseVersion(version) || !parseVersion(minimum)) {
    return false;
  }
  return compareVersions(version, minimum) < 0;
};

// The higher of two versions; an unknown one is ignored
export const maxVersion = (a, b) => {
  if (!parseVersion(a)) {
    return parseVersion(b) ? b : null;
  }
  if (!parseVersion(b)) {
    return a;
  }
  return compareVersions(a, b) >= 0 ? a : b;
};

// Android compares whole build numbers (versionCode): -1, 0 or 1
export const compareBuilds = (a, b) => {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left === right) {
    return 0;
  }
  return left > right ? 1 : -1;
};
