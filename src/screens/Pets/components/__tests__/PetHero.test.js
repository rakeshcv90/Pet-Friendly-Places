import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PetHero } from '../PetHero';

describe('PetHero', () => {
  it('shows the title, the subtitle and its children', () => {
    const { getByText } = render(
      <PetHero title="Luna" subtitle="Golden Retriever" onBack={jest.fn()}>
        <Text>extra</Text>
      </PetHero>,
    );

    expect(getByText('Luna')).toBeTruthy();
    expect(getByText('Golden Retriever')).toBeTruthy();
    expect(getByText('extra')).toBeTruthy();
  });

  it('goes back from the round back button', () => {
    const onBack = jest.fn();
    const { getByTestId, getByLabelText } = render(<PetHero title="Luna" onBack={onBack} />);

    expect(getByLabelText('Back')).toBeTruthy();
    fireEvent.press(getByTestId('pet-hero-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the label beside the round back button', () => {
    const { getByText, getByTestId } = render(
      <PetHero title="Luna" backLabel="🐾 My pets" onBack={jest.fn()} />,
    );

    expect(getByText('🐾 My pets')).toBeTruthy();
    expect(getByTestId('pet-hero-back')).toBeTruthy();
  });

  it('uses a default label when none is given', () => {
    const { getByText } = render(<PetHero title="Luna" onBack={jest.fn()} />);
    expect(getByText('🐾 Back')).toBeTruthy();
  });

  it('shows the small label above the title when one is given', () => {
    const { getByText, queryByText, rerender } = render(
      <PetHero title="Edit Cleo" eyebrow="EDITING" onBack={jest.fn()} />,
    );
    expect(getByText('EDITING')).toBeTruthy();

    rerender(<PetHero title="Edit Cleo" onBack={jest.fn()} />);
    expect(queryByText('EDITING')).toBeNull();
  });

  it('draws the accent bar under the title', () => {
    const { getByTestId } = render(<PetHero title="Luna" onBack={jest.fn()} />);
    expect(getByTestId('pet-hero-accent')).toBeTruthy();
  });

  it('keeps the title and subtitle readable while they animate in', () => {
    const { getByText } = render(
      <PetHero title="Luna" subtitle="Rabbit · Desi" onBack={jest.fn()} />,
    );
    expect(getByText('Luna')).toBeTruthy();
    expect(getByText('Rabbit · Desi')).toBeTruthy();
  });
});
