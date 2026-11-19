import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CommunityPostsScreen } from '../CommunityPostsScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('../../../store', () => ({
  useStore: jest.fn(selector =>
    selector({
      isDarkMode: false,
      user: { name: 'Rakesh Rao' },
    }),
  ),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

describe('CommunityPostsScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, all 3 tabs (All, Posts, Replies) and post cards', () => {
    const { getByText, getByTestId } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    expect(getByText('Community Posts')).toBeTruthy();
    expect(getByTestId('tab-all')).toBeTruthy();
    expect(getByTestId('tab-posts')).toBeTruthy();
    expect(getByTestId('tab-replies')).toBeTruthy();
  });

  it('switches between tabs and filters correctly', () => {
    const { getByTestId, queryByText } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: { initialTab: 'all' } }} />,
    );

    // Filter to Posts tab
    fireEvent.press(getByTestId('tab-posts'));
    expect(queryByText('Weekend hike at Cubbon Park with Simba 🐾')).toBeTruthy();

    // Filter to Replies tab
    fireEvent.press(getByTestId('tab-replies'));
    expect(queryByText('Reply: Cabo Serai private cove recommendation')).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { getByTestId } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    fireEvent.press(getByTestId('community-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('opens compose modal and creates a new post', () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    // Open compose modal
    fireEvent.press(getByTestId('create-post-top-btn'));
    expect(getByText('Create Community Post')).toBeTruthy();

    // Fill in inputs
    fireEvent.changeText(
      getByPlaceholderText('e.g. Morning off-leash run at Cubbon Park...'),
      'Test Trail with Milo',
    );
    fireEvent.changeText(
      getByPlaceholderText('What made this place special for your pet? Any clean water bowls or leash tips?'),
      'Great grassy patch with lots of shade.',
    );

    // Submit
    fireEvent.press(getByText('Publish Post'));

    // Should now show newly created post in the list
    expect(getByText('Test Trail with Milo')).toBeTruthy();
  });

  it('renders all community posts directly in the feed', () => {
    const { getByTestId, getByText } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    expect(getByTestId('post-card-post-1')).toBeTruthy();
    expect(getByText('Weekend hike at Cubbon Park with Simba 🐾')).toBeTruthy();
    expect(getByText('Sunny afternoon at Therpup Dog Cafe ☕')).toBeTruthy();
  });

  it('does not render share button on post cards', () => {
    const { queryByText } = render(
      <CommunityPostsScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    expect(queryByText('Share')).toBeNull();
  });
});

