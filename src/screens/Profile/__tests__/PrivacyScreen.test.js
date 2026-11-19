import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PrivacyScreen, PRIVACY_ROWS } from '../PrivacyScreen';
import { usePrivacySettings, useUpdatePrivacy } from '../../../hooks/usePrivacy';
import { useStore } from '../../../store';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
}));

jest.mock('../../../hooks/usePrivacy', () => ({
  usePrivacySettings: jest.fn(),
  useUpdatePrivacy: jest.fn(),
}));

const SETTINGS = {
  isPublic: true,
  showPets: true,
  showCommunityPosts: true,
  showReviews: true,
  showLeaderboard: true,
  showSavedPlaces: false,
  allowFollowers: true,
};

const loaded = (overrides = {}) => ({
  data: { ...SETTINGS, ...overrides },
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
});

describe('PrivacyScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  const mutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    usePrivacySettings.mockReturnValue(loaded());
    useUpdatePrivacy.mockReturnValue({ mutate });
    useStore.setState({ user: { profileSlug: 'rakesh-rao-a82b24' } });
  });

  it('shows the header, the public profile card and every switch in its saved position', () => {
    const { getByText, getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    expect(getByText('Privacy')).toBeTruthy();
    expect(getByText('YOUR PROFILE')).toBeTruthy();
    expect(getByText('Public Profile')).toBeTruthy();
    expect(getByText('What to show on your profile')).toBeTruthy();
    expect(getByText('Each toggle saves immediately')).toBeTruthy();

    expect(getByTestId('privacy-isPublic').props.value).toBe(true);
    PRIVACY_ROWS.forEach(row => {
      expect(getByText(row.title)).toBeTruthy();
      expect(getByTestId(`privacy-${row.field}`).props.value).toBe(SETTINGS[row.field]);
    });
    expect(getByTestId('privacy-showSavedPlaces').props.value).toBe(false);
  });

  it('goes back from the header button', () => {
    const { getByTestId } = render(<PrivacyScreen navigation={navigation} />);
    fireEvent.press(getByTestId('privacy-back-btn'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('saves only the switch that was changed', () => {
    const { getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    fireEvent(getByTestId('privacy-showPets'), 'valueChange', false);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({ field: 'showPets', value: false });

    fireEvent(getByTestId('privacy-showSavedPlaces'), 'valueChange', true);
    expect(mutate.mock.calls[1][0]).toEqual({ field: 'showSavedPlaces', value: true });

    fireEvent(getByTestId('privacy-isPublic'), 'valueChange', false);
    expect(mutate.mock.calls[2][0]).toEqual({ field: 'isPublic', value: false });
  });

  it('locks a switch while it is being saved, then unlocks it', async () => {
    let settle;
    mutate.mockImplementation((vars, options) => {
      settle = () => options.onSettled();
    });
    const { getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    fireEvent(getByTestId('privacy-showReviews'), 'valueChange', false);
    expect(getByTestId('privacy-showReviews').props.disabled).toBe(true);
    expect(getByTestId('privacy-showPets').props.disabled).toBeFalsy();

    settle();
    await waitFor(() => expect(getByTestId('privacy-showReviews').props.disabled).toBeFalsy());
  });

  it('tells the user when a switch could not be saved', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mutate.mockImplementation((vars, options) => {
      options.onError(new Error('network'));
      options.onSettled();
    });
    const { getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    fireEvent(getByTestId('privacy-showPets'), 'valueChange', false);
    expect(alert).toHaveBeenCalledWith('Could not save', 'network');
    alert.mockRestore();
  });

  it('shows the public profile link and opens it', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText, getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    expect(getByText('petfriendlyplaces.in/profile/rakesh-rao-a82b24')).toBeTruthy();
    fireEvent.press(getByTestId('privacy-profile-link'));
    expect(open).toHaveBeenCalledWith('https://petfriendlyplaces.in/profile/rakesh-rao-a82b24');
    open.mockRestore();
  });

  it('hides the link when the account has no profile address', () => {
    useStore.setState({ user: {} });
    const { queryByTestId } = render(<PrivacyScreen navigation={navigation} />);
    expect(queryByTestId('privacy-profile-link')).toBeNull();
  });

  it('says the public profile is hidden when it is switched off', () => {
    usePrivacySettings.mockReturnValue(loaded({ isPublic: false }));
    const { getByTestId } = render(<PrivacyScreen navigation={navigation} />);
    expect(getByTestId('privacy-hidden-note')).toBeTruthy();
  });

  it('shows a loader while the settings load', () => {
    usePrivacySettings.mockReturnValue({ ...loaded(), data: undefined, isLoading: true });
    const { getByText, queryByText } = render(<PrivacyScreen navigation={navigation} />);
    expect(getByText('Loading your privacy settings…')).toBeTruthy();
    expect(queryByText('My Pets')).toBeNull();
  });

  it('offers a retry when the settings fail to load', () => {
    const refetch = jest.fn();
    usePrivacySettings.mockReturnValue({ ...loaded(), data: undefined, isError: true, refetch });
    const { getByText, getByTestId } = render(<PrivacyScreen navigation={navigation} />);

    expect(getByText('Could not load your settings')).toBeTruthy();
    fireEvent.press(getByTestId('privacy-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
