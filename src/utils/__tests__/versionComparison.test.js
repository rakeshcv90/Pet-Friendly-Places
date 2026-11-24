import {
  compareBuilds,
  compareVersions,
  isVersionBelow,
  maxVersion,
  parseVersion,
} from '../versionComparison';

describe('parseVersion', () => {
  it('reads one, two and three part versions, with or without a v', () => {
    expect(parseVersion('1')).toEqual([1, 0, 0]);
    expect(parseVersion('1.4')).toEqual([1, 4, 0]);
    expect(parseVersion('v1.4.2')).toEqual([1, 4, 2]);
  });

  it('ignores a suffix after the numbers', () => {
    expect(parseVersion('1.4.2-beta.1')).toEqual([1, 4, 2]);
  });

  it('gives null for anything that is not a version', () => {
    expect(parseVersion('')).toBeNull();
    expect(parseVersion(null)).toBeNull();
    expect(parseVersion('latest')).toBeNull();
  });
});

describe('compareVersions', () => {
  it('orders by number, not by text', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('2.0.0', '10.0.0')).toBe(-1);
  });

  it('treats an unknown version as equal, never as older', () => {
    expect(compareVersions('abc', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', undefined)).toBe(0);
  });
});

describe('isVersionBelow', () => {
  it('is true only when the installed version is lower than the minimum', () => {
    expect(isVersionBelow('1.0', '1.2.0')).toBe(true);
    expect(isVersionBelow('1.2.0', '1.2.0')).toBe(false);
    expect(isVersionBelow('1.3', '1.2.0')).toBe(false);
  });

  it('never blocks on a missing or broken minimum', () => {
    expect(isVersionBelow('1.0', '')).toBe(false);
    expect(isVersionBelow('1.0', undefined)).toBe(false);
    expect(isVersionBelow('1.0', 'soon')).toBe(false);
    expect(isVersionBelow('1.0', '0.0.0')).toBe(false);
  });
});

describe('maxVersion', () => {
  it('returns the higher one and skips an unknown one', () => {
    expect(maxVersion('1.2.0', '1.10.0')).toBe('1.10.0');
    expect(maxVersion('', '1.1.0')).toBe('1.1.0');
    expect(maxVersion('1.1.0', undefined)).toBe('1.1.0');
    expect(maxVersion('', '')).toBeNull();
  });
});

describe('compareBuilds', () => {
  it('compares whole build numbers', () => {
    expect(compareBuilds('12', '9')).toBe(1);
    expect(compareBuilds(3, '3')).toBe(0);
    expect(compareBuilds('2', '10')).toBe(-1);
  });

  it('is equal when a build is not a number', () => {
    expect(compareBuilds('abc', '1')).toBe(0);
  });
});
