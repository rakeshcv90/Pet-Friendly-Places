import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CommunityDetailScreen } from '../CommunityDetailScreen';
import { PostDetailScreen } from '../PostDetailScreen';
import { useStore } from '../../../store';
import { removeItem, STORAGE_KEYS } from '../../../services/storage/storage';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

const COMMUNITY = {
  slug: 'travel-and-road-trips',
  title: 'Travel & Road Trips',
  icon: '🚗',
  desc: 'Planning a trip with your dog?',
  members: 26,
  posts: 12,
  colors: ['#7B2CFF', '#A26BFF'],
};

const mockPostsState = jest.fn();
const mockPostState = jest.fn();
const mockMembership = jest.fn();
const mockCommunities = jest.fn();
const mockCreateReply = jest.fn(() => ({ isPending: false, mutateAsync: jest.fn() }));
const mockUploadReplyPhoto = jest.fn();
const mockAcceptReply = jest.fn(() => ({ mutateAsync: jest.fn().mockResolvedValue({}) }));
const mockReport = jest.fn(() => ({ isPending: false, mutateAsync: jest.fn().mockResolvedValue({}) }));

jest.mock('../../../hooks/useCommunity', () => ({
  useCommunityPosts: (...args) => mockPostsState(...args),
  useCommunityPost: (...args) => mockPostState(...args),
  useCommunities: () => mockCommunities(),
  useCommunityMembership: (...args) => mockMembership(...args),
  useCreateReply: (...args) => mockCreateReply(...args),
  useAcceptReply: (...args) => mockAcceptReply(...args),
  useReportContent: (...args) => mockReport(...args),
  uploadReplyPhoto: (...args) => mockUploadReplyPhoto(...args),
}));

jest.mock('../../../hooks/useDiscovery', () => ({
  resolveImageUrl: url => url,
}));

describe('CommunityDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommunities.mockReturnValue({ data: undefined });
    mockMembership.mockReturnValue({
      isMember: false,
      isAuthenticated: true,
      isPending: false,
      toggle: jest.fn().mockResolvedValue({ joined: true }),
    });
    mockPostsState.mockReturnValue({
      data: {
        pages: [
          {
            posts: [
              {
                id: 28,
                slug: 'train-bangalore-mumbai-dog-travel-2025',
                type: 'QUESTION',
                title: 'Train travel Bangalore to Mumbai with a dog?',
                replyCount: 9,
                upvoteCount: 3,
                createdAt: '2026-07-05T16:55:00.000Z',
                authorVerifiedCredential: 'EXPERT',
                authorDisplayName: 'Pooja Nair',
              },
            ],
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  it('loads posts for the selected community slug and renders them', () => {
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    expect(mockPostsState).toHaveBeenCalledWith('travel-and-road-trips');
    expect(getByText('26')).toBeTruthy();
    expect(getByText('Members')).toBeTruthy();
    expect(getByText('Train travel Bangalore to Mumbai with a dog?')).toBeTruthy();
    expect(getByText('✓ Expert')).toBeTruthy();
  });

  it('follows the website layout: hero details, filters and guidelines', () => {
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    expect(getByText('🐾 Tails Community')).toBeTruthy();
    expect(getByText('Travel & Road Trips')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('Posts')).toBeTruthy();
    expect(getByText('🔍 Every post here is reviewed by our team before it appears.')).toBeTruthy();
    expect(getByText('Join Community')).toBeTruthy();
    expect(getByText('+ Ask a question')).toBeTruthy();
    expect(getByText('🤝 Community guidelines')).toBeTruthy();
    expect(getByText('PN')).toBeTruthy();
    expect(getByText('❓ Question')).toBeTruthy();
    expect(getByText('💬 9')).toBeTruthy();
    expect(getByText('🐾 3')).toBeTruthy();
  });

  it('opens the new post screen from every New Post / Ask entry point', () => {
    const { getAllByText, getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    // Floating button plus the call-to-action card at the bottom of the list
    const newPostButtons = getAllByText('+ New Post 🐾');
    expect(newPostButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.press(newPostButtons[0]);
    fireEvent.press(getByText('+ Ask a question'));

    expect(mockNavigation.navigate).toHaveBeenCalledTimes(2);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('NewPostScreen', {
      community: COMMUNITY,
      type: 'QUESTION',
    });
  });

  it('shows the Hot badge only for heavily upvoted posts', () => {
    const { queryByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    expect(queryByText('🔥 Hot')).toBeNull();
  });

  it('filters the loaded posts by type', () => {
    const { getByText, queryByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    fireEvent.press(getByText('🎉 Events'));
    expect(queryByText('Train travel Bangalore to Mumbai with a dog?')).toBeNull();
    expect(getByText('No 🎉 Events yet.')).toBeTruthy();

    fireEvent.press(getByText('All'));
    expect(getByText('Train travel Bangalore to Mumbai with a dog?')).toBeTruthy();
  });

  it('opens the full guidelines inside the app from the guidelines card', () => {
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    fireEvent.press(getByText('Read full guidelines →'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('InAppBrowserScreen', {
      url: expect.stringMatching(/\/community-guidelines$/),
      title: 'Community guidelines',
      hideSelectors: expect.arrayContaining(['header', '.pfp-mobile-bottom-nav-outer', '.pfp-chat-wrapper']),
    });
  });

  it('goes back from the hero link and the All Communities button', () => {
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    fireEvent.press(getByText('🐾 Tails Community'));
    fireEvent.press(getByText('All Communities'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(2);
  });

  it('opens the post detail with its slug when a post is pressed', () => {
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    fireEvent.press(getByText('Train travel Bangalore to Mumbai with a dog?'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CommunityPostDetailScreen', {
      slug: 'train-bangalore-mumbai-dog-travel-2025',
      title: 'Train travel Bangalore to Mumbai with a dog?',
    });
  });

  it('shows an empty state for a community without posts', () => {
    mockPostsState.mockReturnValue({
      data: { pages: [{ posts: [] }] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    expect(getByText('No posts yet. Check back soon.')).toBeTruthy();
  });

  it('shows an animated loader while posts load', () => {
    mockPostsState.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    expect(getByText('Loading posts…')).toBeTruthy();
  });

  it('offers a retry when loading fails', () => {
    const refetch = jest.fn();
    mockPostsState.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const { getByText } = render(
      <CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />,
    );

    fireEvent.press(getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('CommunityDetailScreen membership', () => {
  const renderScreen = () =>
    render(<CommunityDetailScreen navigation={mockNavigation} route={{ params: { community: COMMUNITY } }} />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockCommunities.mockReturnValue({ data: undefined });
    mockPostsState.mockReturnValue({ data: { pages: [{ posts: [] }] }, isLoading: false, isError: false, refetch: jest.fn() });
  });

  const membership = overrides => ({
    isMember: false,
    isAuthenticated: true,
    isPending: false,
    toggle: jest.fn().mockResolvedValue({ joined: true }),
    ...overrides,
  });

  it('joins with a single request when a signed-in user taps Join Community', async () => {
    const toggle = jest.fn().mockResolvedValue({ joined: true });
    mockMembership.mockReturnValue(membership({ toggle }));
    const { getByText, queryByText } = renderScreen();

    expect(mockMembership).toHaveBeenCalledWith('travel-and-road-trips');
    fireEvent.press(getByText('Join Community'));

    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1));
    expect(queryByText('Sign in to join')).toBeNull();
  });

  it('shows Leave Community for members and confirms in the branded popup first', async () => {
    const toggle = jest.fn().mockResolvedValue({ joined: false });
    mockMembership.mockReturnValue(membership({ isMember: true, toggle }));
    const { getByText, queryByText } = renderScreen();

    expect(queryByText('Join Community')).toBeNull();
    fireEvent.press(getByText('Leave Community'));

    // Nothing is sent until the user confirms in the popup
    expect(getByText('Leave Travel & Road Trips?')).toBeTruthy();
    expect(toggle).not.toHaveBeenCalled();

    fireEvent.press(getByText('Leave'));
    await waitFor(() => expect(toggle).toHaveBeenCalledTimes(1));
  });

  it('keeps the membership when the user chooses Stay', () => {
    const toggle = jest.fn();
    mockMembership.mockReturnValue(membership({ isMember: true, toggle }));
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Leave Community'));
    fireEvent.press(getByText('Stay'));

    expect(toggle).not.toHaveBeenCalled();
  });

  it('asks signed-out users to sign in without calling the API', () => {
    const toggle = jest.fn();
    mockMembership.mockReturnValue(membership({ isAuthenticated: false, toggle }));
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Join Community'));

    expect(getByText('Sign in to join')).toBeTruthy();
    expect(toggle).not.toHaveBeenCalled();
  });

  it('ignores taps while a membership request is in flight', () => {
    const toggle = jest.fn();
    mockMembership.mockReturnValue(membership({ isPending: true, toggle }));
    const { getByText } = renderScreen();

    // The paw loader card shows and the button is disabled
    expect(getByText('Updating membership…')).toBeTruthy();
    fireEvent.press(getByText('Join Community'));
    expect(toggle).not.toHaveBeenCalled();
  });

  it('reports a failed update in the popup', async () => {
    const toggle = jest.fn().mockRejectedValue(new Error('network'));
    mockMembership.mockReturnValue(membership({ toggle }));
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Join Community'));

    await waitFor(() => expect(getByText('Something went wrong')).toBeTruthy());
  });

  it('shows live member counts from the directory', () => {
    mockMembership.mockReturnValue(membership());
    mockCommunities.mockReturnValue({ data: [{ slug: 'travel-and-road-trips', memberCount: 27, postCount: 12 }] });
    const { getByText } = renderScreen();

    expect(getByText('27')).toBeTruthy();
  });
});

describe('PostDetailScreen', () => {
  it('renders the post and its threaded replies', () => {
    mockPostState.mockReturnValue({
      data: {
        post: {
          id: 28,
          type: 'QUESTION',
          title: 'Train travel Bangalore to Mumbai with a dog?',
          body: "I've read the **IRCTC** rules but nobody has done it.",
          replyCount: 2,
          upvoteCount: 0,
          viewCount: 4,
          createdAt: '2026-07-05T16:55:00.000Z',
          authorDisplayName: 'Pooja Nair',
          authorVerifiedCredential: null,
          imageUrl: null,
        },
        replies: [
          { id: 134, parentReplyId: null, body: 'Parcel Office first.', isAccepted: true, upvoteCount: 2, createdAt: '2026-07-05T17:25:00.000Z', authorDisplayName: 'Arjun Singh', authorVerifiedCredential: 'EXPERT' },
          { id: 297, parentReplyId: 134, body: 'Tip the guard.', isAccepted: false, upvoteCount: 0, createdAt: '2026-07-05T17:45:00.000Z', authorDisplayName: 'Pooja Nair', authorVerifiedCredential: null },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getAllByText, getByText } = render(
      <PostDetailScreen navigation={mockNavigation} route={{ params: { slug: 'train-bangalore-mumbai-dog-travel-2025' } }} />,
    );

    expect(mockPostState).toHaveBeenCalledWith('train-bangalore-mumbai-dog-travel-2025');
    expect(getAllByText('Train travel Bangalore to Mumbai with a dog?').length).toBeGreaterThan(0);
    expect(getByText("I've read the IRCTC rules but nobody has done it.")).toBeTruthy();
    expect(getByText('2 Replies')).toBeTruthy();
    expect(getByText('✓ Accepted answer')).toBeTruthy();
    expect(getByText('Parcel Office first.')).toBeTruthy();
    expect(getByText('Tip the guard.')).toBeTruthy();
  });

  describe('reply composer', () => {
    const POST_STATE = replies => ({
      data: {
        post: {
          id: 28,
          type: 'QUESTION',
          title: 'A question',
          body: 'Body text',
          replyCount: replies.length,
          upvoteCount: 0,
          viewCount: 1,
          createdAt: '2026-07-05T16:55:00.000Z',
          authorDisplayName: 'Pooja Nair',
          imageUrl: null,
        },
        replies,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const renderPost = () =>
      render(<PostDetailScreen navigation={mockNavigation} route={{ params: { slug: 'a-question' } }} />);

    beforeEach(() => {
      removeItem(STORAGE_KEYS.COMMUNITY_PENDING_REPLIES);
      useStore.setState({ isAuthenticated: true });
      mockPostState.mockReturnValue(POST_STATE([]));
      mockCreateReply.mockReturnValue({ isPending: false, mutateAsync: jest.fn().mockResolvedValue({ id: 7 }) });
    });

    it('invites the first reply when the thread is empty', () => {
      const { getByText, getByLabelText } = renderPost();

      expect(getByText('Be the first to reply!')).toBeTruthy();
      expect(getByText('0/10000')).toBeTruthy();
      expect(getByText('Markdown formatting is supported. Replies are reviewed before going live.')).toBeTruthy();
      expect(getByLabelText('Post Reply').props.accessibilityState?.disabled).toBe(true);
    });

    it('shows "Post a reply" once the thread has replies', () => {
      mockPostState.mockReturnValue(
        POST_STATE([{ id: 1, parentReplyId: null, body: 'Hi', isAccepted: false, upvoteCount: 0, createdAt: '2026-07-05T17:25:00.000Z', authorDisplayName: 'Arjun' }]),
      );
      const { getByText } = renderPost();

      expect(getByText('Post a reply')).toBeTruthy();
    });

    it('submits the reply and confirms it is pending review', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({ id: 7 });
      mockCreateReply.mockReturnValue({ isPending: false, mutateAsync });
      const { getByLabelText, getByText } = renderPost();

      fireEvent.changeText(getByLabelText('Your reply'), '  Parcel office first.  ');
      expect(getByText('24/10000')).toBeTruthy();
      fireEvent.press(getByLabelText('Post Reply'));

      await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ body: 'Parcel office first.', parentReplyId: null }));
      await waitFor(() =>
        expect(getByText('✅ Reply submitted and pending review, thank you for sharing! 🐾')).toBeTruthy(),
      );
    });

    it('needs at least 10 characters before a reply can be posted', () => {
      const { getByLabelText, getByText } = renderPost();

      fireEvent.changeText(getByLabelText('Your reply'), 'Too short');
      expect(getByText('Replies need at least 10 characters.')).toBeTruthy();
      expect(getByLabelText('Post Reply').props.accessibilityState?.disabled).toBe(true);
    });

    it('shows a reply you just sent as pending review until it is approved', async () => {
      const { getByLabelText, getByText, queryByText } = renderPost();

      expect(queryByText('⏳ Pending review')).toBeNull();
      fireEvent.changeText(getByLabelText('Your reply'), 'Parcel office first, then the guard.');
      fireEvent.press(getByLabelText('Post Reply'));

      await waitFor(() => expect(getByText('⏳ Pending review')).toBeTruthy());
      expect(getByText('Parcel office first, then the guard.')).toBeTruthy();
    });

    it('keeps a pending reply after leaving and reopening the post, until the server lists it', async () => {
      const first = renderPost();
      fireEvent.changeText(first.getByLabelText('Your reply'), 'Parcel office first, then the guard.');
      fireEvent.press(first.getByLabelText('Post Reply'));
      await waitFor(() => expect(first.getByText('⏳ Pending review')).toBeTruthy());
      first.unmount();

      // Reopened: the server does not list it yet, so it is still shown as pending
      const second = renderPost();
      expect(second.getByText('Parcel office first, then the guard.')).toBeTruthy();
      expect(second.getByText('⏳ Pending review')).toBeTruthy();
      second.unmount();

      // Approved: the server now lists it, so the pending copy goes away
      mockPostState.mockReturnValue(
        POST_STATE([{ id: 90, parentReplyId: null, body: 'Parcel office first, then the guard.', isAccepted: false, upvoteCount: 0, createdAt: '2026-07-05T17:25:00.000Z', authorDisplayName: 'You' }]),
      );
      const third = renderPost();
      expect(third.queryByText('⏳ Pending review')).toBeNull();
      expect(third.getAllByText('Parcel office first, then the guard.')).toHaveLength(1);
    });

    it('shows the server error when the reply is rejected', async () => {
      mockCreateReply.mockReturnValue({
        isPending: false,
        mutateAsync: jest.fn().mockRejectedValue({ response: { data: { error: 'Replies are limited to 5 per hour.' } } }),
      });
      const { getByLabelText, findByText } = renderPost();

      fireEvent.changeText(getByLabelText('Your reply'), 'Anything goes here');
      fireEvent.press(getByLabelText('Post Reply'));

      expect(await findByText('Replies are limited to 5 per hour.')).toBeTruthy();
    });
  });

  describe('reply actions', () => {
    const REPLIES = [
      { id: 10, parentReplyId: null, body: 'Parcel office first.', isAccepted: false, upvoteCount: 0, createdAt: '2026-07-05T17:25:00.000Z', authorDisplayName: 'Arjun Singh' },
      { id: 11, parentReplyId: 10, body: 'Tip the guard.', isAccepted: false, upvoteCount: 0, createdAt: '2026-07-05T17:45:00.000Z', authorDisplayName: 'Pooja Nair' },
    ];
    const setPost = type =>
      mockPostState.mockReturnValue({
        data: {
          post: { id: 28, type, title: 'A question', body: 'Body', replyCount: 2, upvoteCount: 0, viewCount: 1, createdAt: '2026-07-05T16:55:00.000Z', authorDisplayName: 'Pooja Nair', imageUrl: null },
          replies: REPLIES,
        },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
        isRefetching: false,
      });
    const renderPost = () =>
      render(<PostDetailScreen navigation={mockNavigation} route={{ params: { slug: 'a-question' } }} />);

    beforeEach(() => {
      removeItem(STORAGE_KEYS.COMMUNITY_PENDING_REPLIES);
      useStore.setState({ isAuthenticated: true });
      setPost('QUESTION');
    });

    it('offers Accept and Reply on top-level replies, and only Report on nested ones', () => {
      const { getAllByLabelText } = renderPost();

      expect(getAllByLabelText('Accept answer')).toHaveLength(1);
      expect(getAllByLabelText('Reply')).toHaveLength(1);
      expect(getAllByLabelText('Report')).toHaveLength(2);
    });

    it('does not offer Accept on discussions', () => {
      setPost('DISCUSSION');
      const { queryByLabelText } = renderPost();

      expect(queryByLabelText('Accept answer')).toBeNull();
    });

    it('accepts an answer', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockAcceptReply.mockReturnValue({ mutateAsync });
      const { getByLabelText } = renderPost();

      fireEvent.press(getByLabelText('Accept answer'));
      await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(10));
    });

    it('shows why an answer could not be accepted', async () => {
      mockAcceptReply.mockReturnValue({
        mutateAsync: jest.fn().mockRejectedValue({ response: { data: { error: 'Only the author can accept an answer.' } } }),
      });
      const { getByLabelText, findByText } = renderPost();

      fireEvent.press(getByLabelText('Accept answer'));
      expect(await findByText('Only the author can accept an answer.')).toBeTruthy();
    });

    it('opens an inline reply box and posts a reply to that reply', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({ id: 50 });
      mockCreateReply.mockReturnValue({ isPending: false, mutateAsync });
      const { getByLabelText, getAllByLabelText, getByText } = renderPost();

      fireEvent.press(getByLabelText('Reply'));
      // the form's label and the main composer's label are both "Your reply"
      const boxes = getAllByLabelText('Your reply');
      fireEvent.changeText(boxes[0], 'Short');
      expect(getByLabelText('Post reply').props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(boxes[0], 'Thanks, that really helps!');
      fireEvent.press(getByLabelText('Post reply'));

      await waitFor(() =>
        expect(mutateAsync).toHaveBeenCalledWith({ body: 'Thanks, that really helps!', parentReplyId: 10 }),
      );
      expect(await waitFor(() => getByText('✓ Reply submitted, it will appear after review. 🐾'))).toBeTruthy();
    });

    it('reports a reply with a reason', async () => {
      const mutateAsync = jest.fn().mockResolvedValue({});
      mockReport.mockReturnValue({ isPending: false, mutateAsync });
      const { getAllByLabelText, getByLabelText, getByText } = renderPost();

      fireEvent.press(getAllByLabelText('Report')[0]);
      expect(getByText('🚩 Report reply')).toBeTruthy();
      expect(getByLabelText('Submit report').props.accessibilityState?.disabled).toBe(true);

      fireEvent.changeText(getByLabelText('Reason for report'), '  Spam link  ');
      fireEvent.press(getByLabelText('Submit report'));

      await waitFor(() =>
        expect(mutateAsync).toHaveBeenCalledWith({ targetType: 'reply', targetId: 10, reason: 'Spam link' }),
      );
      expect(
        await waitFor(() =>
          getByText('✓ Report submitted. Thank you for helping keep Tails Community safe. 🐾'),
        ),
      ).toBeTruthy();
    });
  });
});
