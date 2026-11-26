import React from 'react';
import { FlatList } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { CityPickerModal } from '../index';

const CITIES = ['Delhi', 'Gurugram', 'Noida', 'Goa'];

describe('CityPickerModal', () => {
  it('lists the cities and filters them as the person types', () => {
    const { getByText, queryByText, getByPlaceholderText } = render(
      <CityPickerModal visible cities={CITIES} selectedCity="Delhi" onSelectCity={jest.fn()} />,
    );
    CITIES.forEach(city => expect(getByText(city)).toBeTruthy());

    fireEvent.changeText(getByPlaceholderText(/search/i), 'go');
    expect(getByText('Goa')).toBeTruthy();
    expect(queryByText('Delhi')).toBeNull();
  });

  it('hands the chosen city back', () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    const onSelectCity = jest.fn();
    const { getByText } = render(
      <CityPickerModal visible cities={CITIES} onSelectCity={onSelectCity} />,
    );
    fireEvent.press(getByText('Noida'));
    act(() => {
      jest.runAllTimers();
    });
    expect(onSelectCity).toHaveBeenCalledWith('Noida');
    jest.useRealTimers();
  });

  it('tunes the list for a long list of cities', () => {
    const { UNSAFE_getByType } = render(
      <CityPickerModal visible cities={CITIES} onSelectCity={jest.fn()} />,
    );
    const list = UNSAFE_getByType(FlatList);
    expect(list.props.initialNumToRender).toBe(14);
    expect(list.props.windowSize).toBe(9);
    expect(list.props.keyExtractor('Goa')).toBe('Goa');
  });
});
