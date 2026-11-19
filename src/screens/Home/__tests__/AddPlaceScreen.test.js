import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AddPlaceScreen } from '../AddPlaceScreen';
import { submitPlace } from '../../../hooks/placeSubmission';

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
}));

jest.mock('../../../hooks/placeSubmission', () => ({
  submitPlace: jest.fn(),
  createIdempotencyKey: jest.fn(() => 'key-1'),
}));

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

const LONG_EXPERIENCE = 'Lovely garden seating and the staff brought water for our dog.';

describe('AddPlaceScreen', () => {
  const mockNavigation = { goBack: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    launchImageLibrary.mockResolvedValue({ assets: [{ uri: 'file://photo1.jpg' }] });
    submitPlace.mockResolvedValue({ ok: true, status: 201, data: {} });
  });

  const renderScreen = () => render(<AddPlaceScreen navigation={mockNavigation} />);

  const fillValidForm = async utils => {
    fireEvent.changeText(utils.getByTestId('add-place-name-input'), 'The Barking Cat Cafe');
    fireEvent.press(utils.getByTestId('add-place-category-Food & Cafes'));
    fireEvent.changeText(utils.getByTestId('add-place-city-input'), 'Mumbai');
    fireEvent.changeText(utils.getByTestId('add-place-experience-input'), LONG_EXPERIENCE);
    fireEvent.press(utils.getByTestId('add-place-upload-btn'));
    await waitFor(() => expect(launchImageLibrary).toHaveBeenCalled());
    fireEvent.press(utils.getByTestId('add-place-terms'));
  };

  it('renders the hero, sections, categories and checklist', () => {
    const { getByText } = renderScreen();

    expect(getByText('Add a Pet Friendly Place')).toBeTruthy();
    expect(getByText('Where is it?')).toBeTruthy();
    expect(getByText('Your Pet Experience')).toBeTruthy();
    expect(getByText('Photos')).toBeTruthy();
    [
      'Stays',
      'Food & Cafes',
      'Water & Nature',
      'Pet Care',
      'Travel Options',
      'Workplaces',
      'Public Places',
    ].forEach(category => expect(getByText(category)).toBeTruthy());
    expect(getByText('Add the place name')).toBeTruthy();
    expect(getByText('Accept the photo-use terms for this submission')).toBeTruthy();
  });

  it('goes back when the back button is pressed', () => {
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('add-place-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('validates required fields in order', () => {
    const { getByTestId, getByText } = renderScreen();

    fireEvent.press(getByTestId('add-place-submit-btn'));
    expect(getByText('Please add the place name.')).toBeTruthy();

    fireEvent.changeText(getByTestId('add-place-name-input'), 'The Barking Cat Cafe');
    fireEvent.press(getByTestId('add-place-submit-btn'));
    expect(getByText('Please select a category.')).toBeTruthy();

    fireEvent.press(getByTestId('add-place-category-Stays'));
    fireEvent.press(getByTestId('add-place-submit-btn'));
    expect(getByText('Please add the city.')).toBeTruthy();

    fireEvent.changeText(getByTestId('add-place-city-input'), 'Mumbai');
    fireEvent.changeText(getByTestId('add-place-experience-input'), 'too short');
    fireEvent.press(getByTestId('add-place-submit-btn'));
    expect(getByText('Your experience must be at least 30 characters.')).toBeTruthy();

    fireEvent.changeText(getByTestId('add-place-experience-input'), LONG_EXPERIENCE);
    fireEvent.press(getByTestId('add-place-submit-btn'));
    expect(getByText('Please add at least one photo.')).toBeTruthy();
  });

  it('requires the photo-use terms after a photo is added', async () => {
    const utils = renderScreen();
    fireEvent.changeText(utils.getByTestId('add-place-name-input'), 'The Barking Cat Cafe');
    fireEvent.press(utils.getByTestId('add-place-category-Stays'));
    fireEvent.changeText(utils.getByTestId('add-place-city-input'), 'Mumbai');
    fireEvent.changeText(utils.getByTestId('add-place-experience-input'), LONG_EXPERIENCE);
    fireEvent.press(utils.getByTestId('add-place-upload-btn'));
    await waitFor(() => expect(launchImageLibrary).toHaveBeenCalled());

    fireEvent.press(utils.getByTestId('add-place-submit-btn'));
    expect(utils.getByText('Please accept the photo-use terms for this submission.')).toBeTruthy();
  });

  it('shows the experience character counter', () => {
    const { getByTestId, getByText } = renderScreen();
    expect(getByText('0 / 30 min chars')).toBeTruthy();
    fireEvent.changeText(getByTestId('add-place-experience-input'), 'hello');
    expect(getByText('5 / 30 min chars')).toBeTruthy();
  });

  it('submits a valid form and shows the success dialog', async () => {
    const utils = renderScreen();
    await fillValidForm(utils);

    expect(utils.queryByText('Add the place name')).toBeNull();

    fireEvent.press(utils.getByTestId('add-place-submit-btn'));
    await waitFor(() => expect(utils.getByText('Place Submitted!')).toBeTruthy());

    expect(submitPlace).toHaveBeenCalledTimes(1);
    const args = submitPlace.mock.calls[0][0];
    expect(args.idempotencyKey).toBe('key-1');
    expect(args.photos).toHaveLength(1);
    expect(args.fields).toMatchObject({
      proposedName: 'The Barking Cat Cafe',
      category: 'Food & Cafes',
      city: 'Mumbai',
      descriptionText: LONG_EXPERIENCE,
    });
  });

  it('shows the server error and keeps the form when submission fails', async () => {
    submitPlace.mockResolvedValue({
      ok: false,
      status: 403,
      error: 'Place submissions are only accepted on the live app right now.',
    });
    const utils = renderScreen();
    await fillValidForm(utils);

    fireEvent.press(utils.getByTestId('add-place-submit-btn'));
    await waitFor(() =>
      expect(
        utils.getByText('Place submissions are only accepted on the live app right now.'),
      ).toBeTruthy(),
    );
    expect(utils.queryByText('Place Submitted!')).toBeNull();
  });

  it('does not add the same photo twice', async () => {
    const photo = {
      uri: 'file://cache/a.jpg',
      fileName: 'a.jpg',
      fileSize: 1200,
      width: 800,
      height: 600,
    };
    launchImageLibrary
      .mockResolvedValueOnce({ assets: [photo] })
      .mockResolvedValueOnce({ assets: [{ ...photo, uri: 'file://cache/copy-of-a.jpg' }] });
    const { getByTestId, getByText, getAllByLabelText } = renderScreen();

    fireEvent.press(getByTestId('add-place-upload-btn'));
    await waitFor(() => expect(getAllByLabelText('Remove photo')).toHaveLength(1));

    fireEvent.press(getByTestId('add-place-upload-btn'));
    await waitFor(() =>
      expect(getByText('That photo is already added. Please choose a different one.')).toBeTruthy(),
    );
    expect(getAllByLabelText('Remove photo')).toHaveLength(1);
  });

  it('shows the photo-use summary in a modal and closes it', () => {
    const { getByText, getAllByText, queryByText, getByTestId } = renderScreen();
    expect(queryByText('Photo-use summary')).toBeNull();

    fireEvent.press(getByText('Read the photo-use summary'));
    expect(getByText('Photo-use summary')).toBeTruthy();
    expect(getByText('Terms of Service, section 4')).toBeTruthy();
    expect(getAllByText('Community Guidelines')).toHaveLength(2);

    fireEvent.press(getByTestId('photo-terms-close-btn'));
    expect(queryByText('Terms of Service, section 4')).toBeNull();
  });

  it('opens a terms link in the in-app browser from the modal', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Read the photo-use summary'));
    fireEvent.press(getByText('Privacy, section 5'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'InAppBrowserScreen',
      expect.objectContaining({ title: 'Privacy, section 5' }),
    );
  });
});
