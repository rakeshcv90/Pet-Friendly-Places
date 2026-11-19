import React from 'react';
import { render as rtlRender, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReuniteScreen } from '../ReuniteScreen';

// The post wizard inside the screen submits through react-query
const render = ui =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

let mockCases = [];

jest.mock('../../../hooks/useReunite', () => ({
  ...jest.requireActual('../../../hooks/useReunite'),
  useReuniteCases: () => ({ data: mockCases, isLoading: false }),
}));

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
    mockCases = [];
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

  it('shows a two post preview with a View all button that opens the full list', () => {
    mockCases = ['a', 'b', 'c'].map(id => ({ id, type: 'lost', species: 'dog', name: `Pet ${id}` }));
    const { getByText, queryByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Pet a')).toBeTruthy();
    expect(getByText('Pet b')).toBeTruthy();
    expect(queryByText('Pet c')).toBeNull();

    fireEvent.press(getByText('View all'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ReuniteListScreen', { initialTab: 'all' });
  });

  it('renders all clear empty state when no community posts exist', () => {
    const { getByText } = render(
      <ReuniteScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('ALL CLEAR NEARBY')).toBeTruthy();
    expect(getByText('No posts here yet')).toBeTruthy();
  });
});

