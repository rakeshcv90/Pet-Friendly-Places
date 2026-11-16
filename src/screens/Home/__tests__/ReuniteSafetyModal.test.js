import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReuniteSafetyModal } from '../components/ReuniteSafetyModal';

describe('ReuniteSafetyModal', () => {
  it('shows the safety guide and closes with I understand', () => {
    const onClose = jest.fn();
    const { getByText } = render(<ReuniteSafetyModal visible onClose={onClose} isDarkMode={false} />);

    expect(getByText('Staying safe on Reunite')).toBeTruthy();
    expect(getByText('Stay safe, and help others stay safe.')).toBeTruthy();
    ['Tap to reveal', 'Number consent', 'Never pay before seeing the pet', 'The private detail'].forEach(
      title => expect(getByText(title)).toBeTruthy(),
    );
    expect(getByText('Reunite is always free. Nobody should ever ask you for money.')).toBeTruthy();

    fireEvent.press(getByText('I understand'));
    expect(onClose).toHaveBeenCalled();
  });
});
