import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { UrbaniaBanner, URBANIA_FEATURES } from '../UrbaniaBanner';

describe('UrbaniaBanner', () => {
  it('shows the launch pill, the headline and the offer', () => {
    const { getByText } = render(<UrbaniaBanner onBookNow={jest.fn()} />);

    expect(getByText('NEWLY LAUNCHED')).toBeTruthy();
    expect(getByText('Road trips are better together')).toBeTruthy();
    expect(getByText('Pet-friendly Urbania from Gurugram')).toBeTruthy();
    expect(getByText('10% off for pet parents')).toBeTruthy();
  });

  it('lists the four pet promises', () => {
    const { getByText } = render(<UrbaniaBanner onBookNow={jest.fn()} />);

    expect(URBANIA_FEATURES).toHaveLength(4);
    ['Pet Friendly Driver', 'No Breed Restriction', 'No Pet Limit', 'Truly Pet First'].forEach(
      label => expect(getByText(label)).toBeTruthy(),
    );
  });

  it('shows the van picture', () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    expect(getByTestId('urbania-van')).toBeTruthy();
  });

  it('calls onBookNow when Book Now is pressed', () => {
    const onBookNow = jest.fn();
    const { getByTestId, getByText } = render(<UrbaniaBanner onBookNow={onBookNow} />);

    expect(getByText('Book Now')).toBeTruthy();
    fireEvent.press(getByTestId('urbania-book'));
    expect(onBookNow).toHaveBeenCalledTimes(1);
  });

  it('shows the moving road under the van', () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    expect(getByTestId('urbania-road')).toBeTruthy();
  });

  it("draws the van at an exact size, never at the picture's natural size", () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    const style = StyleSheet.flatten(getByTestId('urbania-van').props.style);

    expect(typeof style.width).toBe('number');
    expect(typeof style.height).toBe('number');
    // Same shape as the van picture (1000 x 458)
    expect(style.width / style.height).toBeCloseTo(1000 / 458, 1);
  });

  it('keeps the launch pill text on one line', () => {
    const { getByText } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    expect(getByText('NEWLY LAUNCHED').props.numberOfLines).toBe(1);
  });

  it('slides the road dashes from left to right', () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    const dashes = getByTestId('urbania-road').children[0];
    const { transform } = StyleSheet.flatten(dashes.props.style);
    const translateX = transform[0].translateX;

    // Each pass starts one dash-gap to the left of rest and ends at rest: it travels rightwards
    expect(translateX.__getValue()).toBeLessThan(0);
    expect(translateX.interpolate).toBeDefined();
  });

  it('shows the van in motion: wind streaks behind it and a rumbling body', () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);

    expect(getByTestId('urbania-wind')).toBeTruthy();
    expect(getByTestId('urbania-wind').children.length).toBeGreaterThanOrEqual(3);
    expect(getByTestId('urbania-van-motion')).toBeTruthy();
  });

  it('keeps the van picture inside the moving body', () => {
    const { getByTestId } = render(<UrbaniaBanner onBookNow={jest.fn()} />);
    const motion = getByTestId('urbania-van-motion');
    const van = getByTestId('urbania-van');

    // The picture is a descendant of the rumbling wrapper, so it moves with it
    let node = van;
    let found = false;
    while (node) {
      if (node === motion) {
        found = true;
        break;
      }
      node = node.parent;
    }
    expect(found).toBe(true);
  });
});
