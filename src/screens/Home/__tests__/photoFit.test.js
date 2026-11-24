import { fitSize } from '../photoFit';

describe('fitSize', () => {
  it('covers a box that is wider than the picture by filling the width and cropping top and bottom', () => {
    // A 2:1 picture in a 400 x 100 box (4:1)
    const size = fitSize(2, 400, 100, 'cover');
    expect(size.width).toBe(400);
    expect(size.height).toBe(200);
    expect(size.left).toBe(0);
    expect(size.top).toBe(-50);
  });

  it('covers a box that is narrower than the picture by filling the height and cropping the sides', () => {
    // A 2:1 picture in a 100 x 100 box
    const size = fitSize(2, 100, 100, 'cover');
    expect(size.height).toBe(100);
    expect(size.width).toBe(200);
    expect(size.left).toBe(-50);
    expect(size.top).toBe(0);
  });

  it('always covers the whole box, whatever the shapes', () => {
    [0.5, 0.75, 1, 1.5, 2].forEach(ratio => {
      [
        [360, 210],
        [210, 360],
        [300, 300],
      ].forEach(([w, h]) => {
        const size = fitSize(ratio, w, h, 'cover');
        expect(size.width).toBeGreaterThanOrEqual(w - 1e-9);
        expect(size.height).toBeGreaterThanOrEqual(h - 1e-9);
        expect(size.width / size.height).toBeCloseTo(ratio, 6);
      });
    });
  });

  it('contains a tall picture in a wide box by filling the height, with room left at the sides', () => {
    // A 3:4 picture in a 400 x 100 box
    const size = fitSize(0.75, 400, 100, 'contain');
    expect(size.height).toBe(100);
    expect(size.width).toBe(75);
    expect(size.left).toBe(162.5);
    expect(size.top).toBe(0);
  });

  it('contains a wide picture in a tall box by filling the width, with room above and below', () => {
    // A 2:1 picture in a 100 x 400 box
    const size = fitSize(2, 100, 400, 'contain');
    expect(size.width).toBe(100);
    expect(size.height).toBe(50);
    expect(size.left).toBe(0);
    expect(size.top).toBe(175);
  });

  it("always keeps the whole picture inside the box for contain, in the picture's own shape", () => {
    [0.5, 0.75, 1, 1.5, 2].forEach(ratio => {
      [
        [360, 210],
        [210, 360],
        [300, 300],
      ].forEach(([w, h]) => {
        const size = fitSize(ratio, w, h, 'contain');
        expect(size.width).toBeLessThanOrEqual(w + 1e-9);
        expect(size.height).toBeLessThanOrEqual(h + 1e-9);
        expect(size.width / size.height).toBeCloseTo(ratio, 6);
        expect(size.left).toBeGreaterThanOrEqual(-1e-9);
        expect(size.top).toBeGreaterThanOrEqual(-1e-9);
      });
    });
  });

  it('fits exactly when the box and the picture have the same shape', () => {
    expect(fitSize(1.5, 300, 200, 'cover')).toEqual({ width: 300, height: 200, left: 0, top: 0 });
    expect(fitSize(1.5, 300, 200, 'contain')).toEqual({ width: 300, height: 200, left: 0, top: 0 });
  });
});
