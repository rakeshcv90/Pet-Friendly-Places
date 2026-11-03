import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { NewPostScreen } from '../NewPostScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() };

const COMMUNITY = { slug: 'travel-and-road-trips', title: 'Travel & Road Trips', icon: '🚗' };

const mockMutateAsync = jest.fn();
const mockUploadPhoto = jest.fn();
const mockCreatePost = { mutateAsync: (...args) => mockMutateAsync(...args), isPending: false };

jest.mock('../../../hooks/useCommunity', () => ({
  useCommunities: () => ({
    data: [
      { slug: 'travel-and-road-trips', name: 'Travel & Road Trips', emoji: '🚗', type: 'TOPIC' },
      { slug: 'delhi-ncr', name: 'Delhi NCR', emoji: '🏙️', type: 'CITY' },
    ],
  }),
  useCreatePost: () => mockCreatePost,
  uploadPostPhoto: (...args) => mockUploadPhoto(...args),
}));

jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn() }));

const VALID_TITLE = 'Best route for Manali with a dog?';
const VALID_BODY = 'Planning a trip from Delhi with my Golden Retriever next month.';

const renderScreen = (params = { community: COMMUNITY, type: 'QUESTION' }) =>
  render(<NewPostScreen navigation={mockNavigation} route={{ params }} />);

describe('NewPostScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePost.isPending = false;
    mockMutateAsync.mockResolvedValue({ id: 99, slug: 'best-route-manali' });
    mockUploadPhoto.mockResolvedValue(true);
  });

  it('follows the website form: community, post types, title, details and notices', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    expect(getByText('New Post')).toBeTruthy();
    expect(getByText('🚗 Travel & Road Trips')).toBeTruthy();
    expect(getByText('Post type')).toBeTruthy();
    expect(getByText('Ask fellow pet parents for help or advice')).toBeTruthy();
    expect(getByText('Start a conversation or share your thoughts')).toBeTruthy();
    expect(getByText('Share a pet-friendly event happening near you')).toBeTruthy();
    expect(getByPlaceholderText('What would you like to ask?')).toBeTruthy();
    expect(getByText('0/200 (min 15)')).toBeTruthy();
    expect(getByText('0/10000 (min 30)')).toBeTruthy();
    expect(getByText('Every post is reviewed before it goes live.')).toBeTruthy();
    expect(getByText('Submit post')).toBeTruthy();
  });

  it('changes the title placeholder with the post type and only shows event fields for events', () => {
    const { getByText, queryByText, getByPlaceholderText } = renderScreen();

    expect(queryByText('📅 Event details')).toBeNull();

    fireEvent.press(getByText('Discussion'));
    expect(getByPlaceholderText("What's on your mind?")).toBeTruthy();

    fireEvent.press(getByText('Event'));
    expect(getByPlaceholderText('Event name or headline')).toBeTruthy();
    expect(getByText('📅 Event details')).toBeTruthy();
    expect(getByText('Venue / Location (optional)')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Bengaluru')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Cubbon Park, Bengaluru')).toBeTruthy();
  });

  it('keeps Submit disabled until the title (15+) and details (30+) meet the API limits', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();
    const titleInput = getByPlaceholderText('What would you like to ask?');
    const bodyInput = getByPlaceholderText(/Add context, details/);

    fireEvent.press(getByText('Submit post'));
    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(getByText('Add a title (15+ characters).')).toBeTruthy();

    // 14 characters is one short of the title minimum
    fireEvent.changeText(titleInput, 'a'.repeat(14));
    fireEvent.changeText(bodyInput, 'b'.repeat(40));
    fireEvent.press(getByText('Submit post'));
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // 29 characters is one short of the details minimum
    fireEvent.changeText(titleInput, 'a'.repeat(15));
    fireEvent.changeText(bodyInput, 'b'.repeat(29));
    expect(getByText('Add details (30+ characters).')).toBeTruthy();
    fireEvent.press(getByText('Submit post'));
    expect(mockMutateAsync).not.toHaveBeenCalled();

    fireEvent.changeText(bodyInput, 'b'.repeat(30));
    fireEvent.press(getByText('Submit post'));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
  });

  it('submits the post payload and shows the moderation message', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), `  ${VALID_TITLE}  `);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(getByText('Post submitted!')).toBeTruthy());
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      communitySlug: 'travel-and-road-trips',
      type: 'QUESTION',
      title: VALID_TITLE,
      body: VALID_BODY,
    });
    expect(getByText(/being reviewed by our moderators/)).toBeTruthy();

    fireEvent.press(getByText('View my post'));
    expect(mockNavigation.replace).toHaveBeenCalledWith('CommunityPostDetailScreen', {
      slug: 'best-route-manali',
      title: VALID_TITLE,
    });
  });

  const futureDate = new Date(2099, 0, 5);

  const fillEvent = ({ withDate = true, withCity = true } = {}) => {
    const utils = renderScreen({ community: COMMUNITY, type: 'EVENT' });
    fireEvent.changeText(utils.getByPlaceholderText('Event name or headline'), 'Dog meetup at the park');
    fireEvent.changeText(utils.getByPlaceholderText(/Add context, details/), VALID_BODY);
    if (withCity) {
      fireEvent.changeText(utils.getByPlaceholderText('e.g. Bengaluru'), ' Bengaluru ');
    }
    fireEvent.changeText(utils.getByPlaceholderText('e.g. Cubbon Park, Bengaluru'), 'Cubbon Park');
    if (withDate) {
      act(() => utils.getByTestId('event-date-picker').props.onChange({}, futureDate));
    }
    return utils;
  };

  it('sends the event date, city and venue for events', async () => {
    const { getByText } = fillEvent();

    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    expect(mockMutateAsync).toHaveBeenCalledWith({
      communitySlug: 'travel-and-road-trips',
      type: 'EVENT',
      title: 'Dog meetup at the park',
      body: VALID_BODY,
      eventDate: '2099-01-05',
      eventCity: 'Bengaluru',
      eventVenue: 'Cubbon Park',
    });
  });

  it('requires a future date and a city for events', () => {
    const noDate = fillEvent({ withDate: false });
    fireEvent.press(noDate.getByText('Submit post'));
    expect(noDate.getByText('Pick a date in the future for your event.')).toBeTruthy();
    noDate.unmount();

    const noCity = fillEvent({ withCity: false });
    fireEvent.press(noCity.getByText('Submit post'));
    expect(noCity.getByText('Add the city where your event takes place.')).toBeTruthy();
    noCity.unmount();

    const today = fillEvent();
    act(() => today.getByTestId('event-date-picker').props.onChange({}, new Date()));
    fireEvent.press(today.getByText('Submit post'));
    expect(today.getByText('Pick a date in the future for your event.')).toBeTruthy();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not send event fields for questions', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), VALID_TITLE);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    expect(mockMutateAsync.mock.calls[0][0]).not.toHaveProperty('eventDate');
    expect(mockMutateAsync.mock.calls[0][0]).not.toHaveProperty('eventCity');
  });

  it('tells the user when a post is live instead of held for review', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 5, slug: 'live-post', status: 'published' });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), VALID_TITLE);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(getByText('Your post is live and visible to the community.')).toBeTruthy());
  });

  it('shows the server error and stays on the form', async () => {
    mockMutateAsync.mockRejectedValueOnce({ response: { data: { error: 'Title is too similar to an existing post' } } });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), VALID_TITLE);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(getByText('Title is too similar to an existing post')).toBeTruthy());
    expect(getByText('Submit post')).toBeTruthy();
  });

  it('treats a response without a numeric id as unconfirmed', async () => {
    mockMutateAsync.mockResolvedValueOnce({ ok: true });
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), VALID_TITLE);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() =>
      expect(
        getByText('The post could not be confirmed. Check your community posts before trying again.'),
      ).toBeTruthy(),
    );
  });

  it('rejects photos of the wrong type or over 8 MB', () => {
    launchImageLibrary.mockImplementationOnce((options, callback) =>
      callback({ assets: [{ uri: 'file:///a.gif', fileName: 'a.gif', type: 'image/gif', fileSize: 1000 }] }),
    );
    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Add photo'));
    expect(getByText('Photos must be JPEG, PNG, WebP, HEIC or HEIF.')).toBeTruthy();
    expect(queryByText('Photos are reviewed before appearing publicly.')).toBeNull();

    launchImageLibrary.mockImplementationOnce((options, callback) =>
      callback({ assets: [{ uri: 'file:///big.jpg', fileName: 'big.jpg', type: 'image/jpeg', fileSize: 9 * 1024 * 1024 }] }),
    );
    fireEvent.press(getByText('Add photo'));
    expect(getByText('Each photo must be 8 MB or smaller.')).toBeTruthy();
  });

  it('accepts HEIC photos and photos without a reported type', () => {
    launchImageLibrary.mockImplementationOnce((options, callback) =>
      callback({
        assets: [
          { uri: 'file:///a.heic', fileName: 'a.heic', type: 'image/heic', fileSize: 1000 },
          { uri: 'file:///b.png', fileName: 'b.png', fileSize: 1000 },
        ],
      }),
    );
    const { getByText, queryByText } = renderScreen();

    fireEvent.press(getByText('Add photo'));
    expect(getByText('Photos are reviewed before appearing publicly.')).toBeTruthy();
    expect(queryByText('Photos must be JPEG, PNG, WebP, HEIC or HEIF.')).toBeNull();
  });

  it('uploads picked photos after the post and offers a retry for failures', async () => {
    launchImageLibrary.mockImplementation((options, callback) =>
      callback({ assets: [{ uri: 'file:///a.jpg', fileName: 'a.jpg', type: 'image/jpeg' }] }),
    );
    mockUploadPhoto.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Add photo'));
    expect(getByText('Photos are reviewed before appearing publicly.')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('What would you like to ask?'), VALID_TITLE);
    fireEvent.changeText(getByPlaceholderText(/Add context, details/), VALID_BODY);
    fireEvent.press(getByText('Submit post'));

    await waitFor(() => expect(getByText(/1 photo could not/)).toBeTruthy());
    expect(mockUploadPhoto).toHaveBeenCalledWith(99, expect.objectContaining({ uri: 'file:///a.jpg' }));

    fireEvent.press(getByText('Retry photo upload'));
    await waitFor(() => expect(mockUploadPhoto).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(() => getByText(/could not/)).toThrow());
  });

  it('lets the user pick a community when none was passed', () => {
    const { getByText, queryByText } = renderScreen({ type: 'QUESTION' });

    expect(getByText('Select a community…')).toBeTruthy();
    fireEvent.press(getByText('Select a community…'));
    fireEvent.press(getByText('Delhi NCR'));

    expect(queryByText('Select a community…')).toBeNull();
    expect(getByText('🏙️ Delhi NCR')).toBeTruthy();
  });

  it('opens the community guidelines inside the app from the notice', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Community guidelines'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('InAppBrowserScreen', {
      url: expect.stringMatching(/^https:\/\/.+\/community-guidelines$/),
      title: 'Community guidelines',
      hideSelectors: expect.arrayContaining(['header', '.pfp-mobile-bottom-nav-outer', '.pfp-chat-wrapper']),
    });
  });

  it('goes back from the back link and Cancel', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Tails Community'));
    fireEvent.press(getByText('Cancel'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(2);
  });
});
