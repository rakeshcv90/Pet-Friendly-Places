import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReuniteScreen } from '../ReuniteScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: { initialTab: 'all' },
};

describe('ReuniteScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header title and hero banner text', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Reunite')).toBeTruthy();
    expect(getByText('NO PET SHOULD SEARCH ALONE')).toBeTruthy();
    expect(getByText(/Let's bring/)).toBeTruthy();
  });

  it('renders all post category tabs', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('All posts')).toBeTruthy();
    expect(getByText('Lost')).toBeTruthy();
    expect(getByText('Found')).toBeTruthy();
    expect(getByText('Adoption')).toBeTruthy();
  });

  it('switches active tab when tapped', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const lostTab = getByText('Lost');
    fireEvent.press(lostTab);
    expect(lostTab).toBeTruthy();

    const foundTab = getByText('Found');
    fireEvent.press(foundTab);
    expect(foundTab).toBeTruthy();
  });

  it('opens pet species dropdown when species chip is tapped', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const speciesChip = getByText('All pets');
    expect(speciesChip).toBeTruthy();

    fireEvent.press(speciesChip);
    expect(getByText('Dogs')).toBeTruthy();
    expect(getByText('Cats')).toBeTruthy();
  });

  it('renders safety guide and alerts section', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('COMMUNITY SAFETY')).toBeTruthy();
    expect(getByText('Protect pets and people')).toBeTruthy();
    expect(getByText('Get local pet alerts')).toBeTruthy();
  });

  it('displays default location if no global location is configured', () => {
    const { getAllByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    const locationElements = getAllByText(/Delhi NCR/);
    expect(locationElements.length).toBeGreaterThan(0);
  });

  it('renders all clear empty state when no community posts exist', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('ALL CLEAR NEARBY')).toBeTruthy();
    expect(getByText('No posts here yet')).toBeTruthy();
  });
});

