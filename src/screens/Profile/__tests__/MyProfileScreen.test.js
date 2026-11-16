import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyProfileScreen } from '../MyProfileScreen';

const mockSetUser = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('../../../store', () => ({
  useStore: jest.fn(selector =>
    selector({
      isDarkMode: false,
      user: {
        name: 'Rakesh Rao',
        email: 'rakeshrao@cvinfotech.com',
        profileSlug: 'rakesh-rao-a82b24',
        location: 'Delhi',
        bio: 'Golden retriever parent and mountain hiker.',
        instagramHandle: 'helloworld',
        youtubeHandle: '@yourchannel',
        website: 'https://yourwebsite.com',
      },
      setUser: mockSetUser,
    }),
  ),
}));

const mockPatchCachedProfile = jest.fn();
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Rakesh Rao' } } }),
  patchCachedProfile: (...args) => mockPatchCachedProfile(...args),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children }) => children,
}));

describe('MyProfileScreen', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders My Profile screen with header, sections, and form fields', () => {
    const { getByText, getByTestId } = render(<MyProfileScreen navigation={mockNavigation} />);

    expect(getByText('My Profile')).toBeTruthy();
    expect(getByText('Public Identity')).toBeTruthy();
    expect(getByText('Profile URL')).toBeTruthy();
    expect(getByText('Your public page on Pet Friendly Places')).toBeTruthy();
    expect(getByText('Bio & Social Links')).toBeTruthy();

    expect(getByTestId('input-display-name')).toBeTruthy();
    expect(getByTestId('input-email-readonly')).toBeTruthy();
    expect(getByTestId('input-profile-slug')).toBeTruthy();
    expect(getByTestId('input-bio')).toBeTruthy();
    expect(getByTestId('input-location')).toBeTruthy();
    expect(getByTestId('input-instagram')).toBeTruthy();
    expect(getByTestId('input-youtube')).toBeTruthy();
    expect(getByTestId('input-website')).toBeTruthy();
  });

  it('navigates back when top back button is pressed', () => {
    const { getByTestId } = render(<MyProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByTestId('my-profile-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('saves updated display name', () => {
    const { getByTestId, getByText } = render(<MyProfileScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByTestId('input-display-name'), 'Rakesh R.');
    fireEvent.press(getByTestId('save-name-btn'));

    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rakesh R.',
        displayName: 'Rakesh R.',
      }),
    );
    // The cached profile is patched too, so useUserProfile() readers show the new name
    expect(mockPatchCachedProfile).toHaveBeenCalledWith(expect.anything(), {
      name: 'Rakesh R.',
      displayName: 'Rakesh R.',
    });
    expect(getByText('Display name updated successfully! ✨')).toBeTruthy();
  });

  it('saves updated profile URL slug', () => {
    const { getByTestId, getByText } = render(<MyProfileScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByTestId('input-profile-slug'), 'rakesh-trips');
    fireEvent.press(getByTestId('save-profile-url-btn'));

    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        profileSlug: 'rakesh-trips',
      }),
    );
    expect(getByText('Profile URL updated successfully! 🔗')).toBeTruthy();
  });

  it('saves bio, location, and social links', () => {
    const { getByTestId, getByText } = render(<MyProfileScreen navigation={mockNavigation} />);

    fireEvent.changeText(getByTestId('input-bio'), 'Loving the trails!');
    fireEvent.changeText(getByTestId('input-location'), 'Bangalore');
    fireEvent.changeText(getByTestId('input-instagram'), 'simba_the_golden');

    fireEvent.press(getByTestId('save-profile-info-btn'));

    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: 'Loving the trails!',
        location: 'Bangalore',
        instagramHandle: 'simba_the_golden',
      }),
    );
    expect(getByText('Profile info saved successfully! 🌟')).toBeTruthy();
  });

  it('opens and closes public profile preview modal', () => {
    const { getByTestId, getByText, queryByText } = render(
      <MyProfileScreen navigation={mockNavigation} />,
    );

    fireEvent.press(getByTestId('view-my-profile-btn'));
    expect(getByText('Live community page')).toBeTruthy();

    fireEvent.press(getByText('Done'));
    expect(queryByText('Live community page')).toBeNull();
  });
});
