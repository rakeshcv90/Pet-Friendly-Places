import React from 'react';
import { Alert, Animated, Dimensions, Keyboard, Linking } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PublicPetProfileScreen } from '../PublicPetProfileScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockPet = jest.fn();
const mockMedia = jest.fn();
const mockFollowState = jest.fn();
const mockMutate = jest.fn();
const mockPawsport = jest.fn();
let mockAuthed = true;

jest.mock('../../../store', () => ({
  useStore: selector => selector({ isDarkMode: false, isAuthenticated: mockAuthed }),
}));
const mockLikes = jest.fn();
const mockComments = jest.fn();
const mockToggleLike = jest.fn();
const mockPostComment = jest.fn();
jest.mock('../../../hooks/usePublicPet', () => ({
  usePetMediaLikes: (...a) => mockLikes(...a),
  usePetMediaComments: (...a) => mockComments(...a),
  useTogglePetMediaLike: () => ({ mutate: mockToggleLike, isPending: false }),
  usePostPetMediaComment: () => ({ mutate: mockPostComment, isPending: false }),
  usePublicPet: (...a) => mockPet(...a),
  usePublicPetMedia: (...a) => mockMedia(...a),
  usePetFollowState: (...a) => mockFollowState(...a),
  useTogglePetFollow: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('../../../hooks/useUser', () => ({ usePawsport: (...a) => mockPawsport(...a) }));

const PET = {
  id: 'p1',
  petName: 'Apple',
  slug: 'apple-sikarwar',
  species: 'dog',
  breed: 'Golden Retriever',
  bio: 'Road-trip dog.',
  profilePhotoUrl: null,
  bannerImageUrl: null,
  pointsTotal: 965,
  pawsportStamps: 20,
  followerCount: 0,
  age: 5,
  gender: 'female',
  socialLinks: { instagram: 'travelwithtails' },
};

const renderScreen = () =>
  render(
    <PublicPetProfileScreen
      navigation={mockNavigation}
      route={{ params: { slug: 'apple-sikarwar' } }}
    />,
  );

describe('PublicPetProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthed = true;
    mockPet.mockReturnValue({ data: PET, isLoading: false, isError: false, refetch: jest.fn() });
    mockMedia.mockReturnValue({ data: [{ id: 'm1', url: '/x', title: 'Kosi River viewpoint' }] });
    mockFollowState.mockReturnValue({
      data: { followerCount: 4, viewerFollowing: false },
      isLoading: false,
    });
    mockLikes.mockReturnValue({ data: { likeCount: 3, viewerLiked: false } });
    mockComments.mockReturnValue({
      data: [{ id: 'c1', body: 'Best pool ever', authorName: 'Ekta', createdAt: '2026-08-01T10:00:00Z' }],
      isLoading: false,
      isError: false,
    });
    mockPawsport.mockReturnValue({
      data: {
        totalStamps: 20,
        distinctPlaces: 18,
        stamps: [
          {
            reviewId: 'r1',
            listingName: 'Tail Club Gurgaon',
            listingCity: 'Gurugram',
            listingCategory: 'Pet Experience',
            rating: 5,
            awardedAt: '2026-06-05T10:00:00.000Z',
          },
        ],
      },
    });
  });

  it('loads the pet by slug and uses its id for follow state and gallery', () => {
    renderScreen();
    expect(mockPet).toHaveBeenCalledWith('apple-sikarwar');
    expect(mockFollowState).toHaveBeenCalledWith('p1');
    expect(mockMedia).toHaveBeenCalledWith('p1');
    expect(mockPawsport).toHaveBeenCalledWith('apple-sikarwar');
  });

  it('shows the profile, rank, stats, stamps and gallery', () => {
    const { getByText, getAllByText } = renderScreen();
    expect(getAllByText('Apple')).toHaveLength(2); // profile card and book cover
    expect(getByText('Dog · Golden Retriever')).toBeTruthy();
    expect(getAllByText('🏔️ Roaming Ranger')).toHaveLength(2); // chip and Rank section
    expect(getByText('965')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5 years old')).toBeTruthy();
    expect(getByText('Female')).toBeTruthy();
    expect(getByText('Road-trip dog.')).toBeTruthy();
    expect(getByText('PAWSPORT — PLACES VISITED')).toBeTruthy();
    // The website's Places Visited list sits under the book
    expect(getByText('🥇 Places Visited')).toBeTruthy();
    expect(getByText('Places Apple has verified visited')).toBeTruthy();
    expect(getByText('Tail Club Gurgaon')).toBeTruthy();
    expect(getByText('📍 Gurugram')).toBeTruthy();
    expect(getByText('★★★★★')).toBeTruthy();
    expect(getByText('Jun 2026')).toBeTruthy();
    expect(getByText('GURUGRAM')).toBeTruthy();
    expect(getByText('Kosi River viewpoint')).toBeTruthy();
    expect(getByText('235 more points to 🛡️ Pawsport Elite')).toBeTruthy();
  });

  it('builds the Pawsport book and turns pages like a book, two stamp pages a spread', () => {
    // Run the turn animation to its end straight away; the leaf is checked in between
    let finishTurn = () => {};
    const timing = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: cb => {
        finishTurn = () => cb && cb({ finished: true });
      },
      stop: jest.fn(),
    }));
    // The leaf is lifted on the next frame; hold that frame so the settled state can be checked
    let liftLeaf = () => {};
    const raf = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
      liftLeaf = cb;
      return 0;
    });
    const many = Array.from({ length: 10 }, (_, i) => ({
      reviewId: `r${i}`,
      listingName: `Place ${i}`,
      listingCity: `City${i}`,
      awardedAt: '2026-08-20T12:00:00.000Z',
    }));
    mockPawsport.mockReturnValue({ data: { totalStamps: 10, stamps: many } });
    const { getByText, queryByText, getByTestId, queryByTestId } = renderScreen();
    fireEvent(getByTestId('pawsport-book'), 'layout', {
      nativeEvent: { layout: { width: 300, height: 300 } },
    });
    const flip = () => {
      act(() => {
        finishTurn();
      });
    };

    // Spread 1: the cover and page 1 (4 stamps)
    expect(getByText('TRAVELLING TAILS · INDIA')).toBeTruthy();
    expect(getByText('PAWSPORT')).toBeTruthy();
    expect(getByText('Page 1')).toBeTruthy();
    expect(getByText('CITY3')).toBeTruthy();
    expect(queryByText('CITY4')).toBeNull();

    // Next: a leaf turns, then pages 2 and 3 sit side by side
    fireEvent.press(getByTestId('pawsport-next'));
    expect(getByTestId('pawsport-leaf')).toBeTruthy();
    flip();
    // Settled on pages 2 and 3 under the leaf before it lifts: nothing swaps in view (no flicker)
    expect(getByTestId('pawsport-leaf')).toBeTruthy();
    expect(getByText('CITY9')).toBeTruthy();
    act(() => {
      liftLeaf();
    });
    expect(queryByTestId('pawsport-leaf')).toBeNull();
    expect(getByText('Page 2')).toBeTruthy();
    expect(getByText('Page 3')).toBeTruthy();
    expect(getByText('CITY4')).toBeTruthy();
    expect(getByText('CITY9')).toBeTruthy();
    expect(queryByText('CITY0')).toBeNull();
    expect(queryByText('TRAVELLING TAILS · INDIA')).toBeNull();

    // Previous turns back to the cover
    fireEvent.press(getByTestId('pawsport-prev'));
    flip();
    act(() => {
      liftLeaf();
    });
    expect(getByText('Page 1')).toBeTruthy();
    expect(getByText('TRAVELLING TAILS · INDIA')).toBeTruthy();
    timing.mockRestore();
    raf.mockRestore();
  });

  it('follows when signed in', () => {
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('Follow'));
    expect(mockMutate).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it('shows Following and unfollows when already following', () => {
    mockFollowState.mockReturnValue({
      data: { followerCount: 4, viewerFollowing: true },
      isLoading: false,
    });
    const { getByLabelText, getByText } = renderScreen();
    expect(getByText('Following')).toBeTruthy();
    fireEvent.press(getByLabelText('Unfollow'));
    expect(mockMutate).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('asks guests to sign in instead of calling the API', () => {
    mockAuthed = false;
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('Follow'));
    expect(mockMutate).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Sign in to follow', 'Sign in to follow Apple.');
    alert.mockRestore();
  });

  it('shows the server message when following fails (e.g. own pet)', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockMutate.mockImplementation((_v, { onError }) =>
      onError({ response: { data: { error: 'You cannot follow your own pet' } } }),
    );
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('Follow'));
    expect(alert).toHaveBeenCalledWith('Could not follow', 'You cannot follow your own pet');
    alert.mockRestore();
  });

  it('shows a loader, then an error with retry', () => {
    mockPet.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const loading = renderScreen();
    expect(loading.getByText('Loading profile…')).toBeTruthy();
    loading.unmount();

    const refetch = jest.fn();
    mockPet.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const failed = renderScreen();
    fireEvent.press(failed.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  it('goes back', () => {
    const { getByLabelText } = renderScreen();
    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  describe('adventure viewer (full-screen story)', () => {
    const PHOTO = {
      id: 'm1',
      mediaType: 'photo',
      url: '/x',
      title: 'Kosi River viewpoint',
      description: 'Great view',
      likeCount: 3,
      commentCount: 1,
    };
    const open = () => {
      const screen = renderScreen();
      fireEvent.press(screen.getByLabelText('Open Kosi River viewpoint'));
      return screen;
    };
    const openSheet = screen => fireEvent.press(screen.getByLabelText('Open comments'));

    beforeEach(() => mockMedia.mockReturnValue({ data: [PHOTO] }));

    it('opens full screen on tap and loads likes and comments for that item', () => {
      const { getByText, getByTestId } = open();

      expect(mockLikes).toHaveBeenCalledWith('m1');
      expect(mockComments).toHaveBeenCalledWith('m1');
      expect(getByTestId('adventure-photo')).toBeTruthy();
      // Big camera photos are downsampled while decoding so Android can show them
      expect(getByTestId('adventure-photo').props.resizeMethod).toBe('resize');
      expect(getByText('Great view')).toBeTruthy();
      // The like and comment counts sit on the right edge
      expect(getByText('1')).toBeTruthy();
    });

    it('does not let the bottom text block cover the like and comment buttons', () => {
      const screen = open();
      // The bottom block spans the screen; its empty areas must pass taps through
      expect(screen.getByTestId('viewer-bottom').props.pointerEvents).toBe('box-none');
    });

    it('shows the comments in a sheet that opens from the comment button and closes on the backdrop', () => {
      const screen = open();
      expect(screen.queryByText('Best pool ever')).toBeNull();

      openSheet(screen);
      expect(screen.getByText('Best pool ever')).toBeTruthy();
      expect(screen.getByText('Ekta', { exact: false })).toBeTruthy();
      expect(screen.getByText('💬 1 comment')).toBeTruthy();

      fireEvent.press(screen.getByTestId('comments-backdrop'));
      expect(screen.queryByText('Best pool ever')).toBeNull();
    });

    it('plays a video fitted to the screen and pauses on tap', () => {
      mockMedia.mockReturnValue({
        data: [{ id: 'v1', mediaType: 'video', url: '/v', thumbnailUrl: '/t', title: 'Kosi River swim' }],
      });
      const screen = renderScreen();
      fireEvent.press(screen.getByLabelText('Open Kosi River swim'));
      const video = () => screen.getByTestId('adventure-video');

      expect(video().props.paused).toBe(false);
      expect(video().props.posterResizeMode).toBe('contain');
      expect(video().props.resizeMode).toBe('contain');
      // Android: a texture view (ViewType.TEXTURE is the number 0), not the surface view that draws black
      // inside a Modal. The word 'texture' crashes the native player.
      expect(video().props.viewType).toBe(0);
      expect(screen.queryByTestId('adventure-photo')).toBeNull();

      fireEvent.press(video());
      expect(video().props.paused).toBe(true);
      fireEvent.press(video());
      expect(video().props.paused).toBe(false);

      // The video holds still while the comments are open
      openSheet(screen);
      expect(video().props.paused).toBe(true);
    });

    it('offers the browser when the phone cannot decode the video', () => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      mockMedia.mockReturnValue({
        data: [{ id: 'v1', mediaType: 'video', url: '/objects/uploads/v', title: 'Kosi River swim' }],
      });
      const screen = renderScreen();
      fireEvent.press(screen.getByLabelText('Open Kosi River swim'));
      expect(screen.queryByText("This video can't play in the app")).toBeNull();

      // ExoPlayer raises this for a 10-bit H.264 file on a phone without that decoder
      act(() => {
        screen.getByTestId('adventure-video').props.onError({ error: { errorCode: 4003 } });
      });
      expect(screen.getByText("This video can't play in the app")).toBeTruthy();

      fireEvent.press(screen.getByLabelText('Open video in browser'));
      expect(openURL).toHaveBeenCalledWith('https://petfriendlyplaces.in/objects/uploads/v');
      openURL.mockRestore();
    });

    it('lifts the comment box above the keyboard and puts it back when the keyboard closes', () => {
      const handlers = {};
      const add = jest.spyOn(Keyboard, 'addListener').mockImplementation((name, cb) => {
        handlers[name] = cb;
        return { remove: jest.fn() };
      });
      const screen = open();
      openSheet(screen);
      const wrap = () => screen.getByTestId('comments-sheet-wrap');
      expect(wrap().props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ paddingBottom: 0 })]),
      );

      const screenHeight = Dimensions.get('screen').height;
      const show = handlers.keyboardWillShow || handlers.keyboardDidShow;
      const hide = handlers.keyboardWillHide || handlers.keyboardDidHide;
      act(() => show({ endCoordinates: { screenY: screenHeight - 320, height: 320 } }));
      expect(wrap().props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ paddingBottom: 320 })]),
      );

      act(() => hide({}));
      expect(wrap().props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ paddingBottom: 0 })]),
      );
      add.mockRestore();
    });

    it('likes when signed in and asks guests to sign in', () => {
      const first = open();
      fireEvent.press(first.getByLabelText('Like'));
      expect(mockToggleLike).toHaveBeenCalled();
      first.unmount();

      mockAuthed = false;
      const guest = open();
      mockToggleLike.mockClear();
      fireEvent.press(guest.getByLabelText('Like'));
      expect(mockToggleLike).not.toHaveBeenCalled();
      // A small in-app banner, not a blocking system dialog
      expect(guest.getByTestId('adventure-toast')).toBeTruthy();
      expect(guest.getByText('Sign in to like this adventure.')).toBeTruthy();
    });

    it('opens the comment sheet from the bottom box and posts a trimmed comment', () => {
      const screen = open();
      fireEvent.press(screen.getByLabelText('Add a comment'));
      fireEvent.changeText(screen.getByTestId('adventure-comment-input'), '  Lovely trip  ');
      fireEvent.press(screen.getByLabelText('Send comment'));
      expect(mockPostComment).toHaveBeenCalledWith('Lovely trip', expect.any(Object));
    });

    it('does not post an empty comment, and asks guests to sign in', () => {
      const signedIn = open();
      openSheet(signedIn);
      fireEvent.press(signedIn.getByLabelText('Send comment'));
      expect(mockPostComment).not.toHaveBeenCalled();
      signedIn.unmount();

      mockAuthed = false;
      const guest = open();
      openSheet(guest);
      fireEvent.changeText(guest.getByTestId('adventure-comment-input'), 'Hi');
      fireEvent.press(guest.getByLabelText('Send comment'));
      expect(mockPostComment).not.toHaveBeenCalled();
      expect(guest.getByText('Sign in to comment.')).toBeTruthy();
    });

    it('confirms a posted comment with a banner, only mentioning approval when it is pending', () => {
      const send = (screen, response) => {
        mockPostComment.mockImplementationOnce((_body, { onSuccess }) => onSuccess(response));
        fireEvent.press(screen.getByLabelText('Add a comment'));
        fireEvent.changeText(screen.getByTestId('adventure-comment-input'), 'Nice');
        fireEvent.press(screen.getByLabelText('Send comment'));
      };

      const live = open();
      send(live, { id: 'c9', status: 'approved' });
      expect(live.getByText('Comment posted')).toBeTruthy();
      expect(live.queryByText(/approved/)).toBeNull();
      expect(live.getByTestId('adventure-comment-input').props.value).toBe('');
      live.unmount();

      const held = open();
      send(held, { id: 'c10', status: 'pending' });
      expect(held.getByText('Comment sent. It will show for others once approved.')).toBeTruthy();
    });

    it('shows the server message in the banner when posting fails', () => {
      mockPostComment.mockImplementationOnce((_body, { onError }) =>
        onError({ response: { data: { error: 'Too many comments' } } }),
      );
      const screen = open();
      fireEvent.press(screen.getByLabelText('Add a comment'));
      fireEvent.changeText(screen.getByTestId('adventure-comment-input'), 'Hello');
      fireEvent.press(screen.getByLabelText('Send comment'));
      expect(screen.getByText('Too many comments')).toBeTruthy();
    });

    it("shows each commenter's name from the API's commenterName, as the website does", () => {
      mockComments.mockReturnValue({
        data: [
          { id: 'c1', body: 'Test purpose', commenterName: 'Rakesh', status: 'approved', createdAt: '2026-11-23T15:08:40.612Z' },
          { id: 'c2', body: 'For testing', commenterName: 'Rakesh', status: 'approved', createdAt: '2026-11-23T15:06:18.179Z' },
        ],
        isLoading: false,
        isError: false,
      });
      const screen = open();
      openSheet(screen);
      expect(screen.getAllByText('Rakesh', { exact: false })).toHaveLength(2);
      expect(screen.queryByText('Pet parent')).toBeNull();
    });

    it('shows your own just-posted comment as You when the API sends no author', () => {
      mockComments.mockReturnValue({
        data: [{ id: 'c9', body: 'Nice' }],
        isLoading: false,
        isError: false,
      });
      mockPostComment.mockImplementationOnce((_body, { onSuccess }) => onSuccess({ id: 'c9' }));
      const screen = open();
      fireEvent.press(screen.getByLabelText('Add a comment'));
      expect(screen.getByText('Pet parent')).toBeTruthy();
      fireEvent.changeText(screen.getByTestId('adventure-comment-input'), 'Nice');
      fireEvent.press(screen.getByLabelText('Send comment'));
      expect(screen.getByText('You')).toBeTruthy();
    });

    it('closes', () => {
      const { getByLabelText, queryByTestId } = open();
      fireEvent.press(getByLabelText('Close'));
      expect(queryByTestId('adventure-photo')).toBeNull();
    });
  });
});
