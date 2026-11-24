import React from 'react';
import { AccessibilityInfo, Animated, LayoutAnimation } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { FollowingScreen, CountUp, petSummaryLine, followedSince } from '../FollowingScreen';
import { useFollowingPets, useUnfollowPet } from '../../../hooks/useFollowing';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
}));
jest.mock('../../../hooks/useFollowing', () => ({
  useFollowingPets: jest.fn(),
  useUnfollowPet: jest.fn(),
}));

const apple = {
  id: 'p1',
  petName: 'Apple',
  slug: 'apple-sikarwar',
  species: 'dog',
  breed: 'Golden Retriever',
  photo: '/uploads/apple.jpg',
  level: 4,
  followerCount: 1,
  followedAt: '2026-11-20T10:00:00Z',
};
const bruno = { id: 'p2', petName: 'Bruno', slug: 'bruno-1', species: 'cat', breed: '', photo: '', level: 0, followerCount: 3 };

const query = (patch = {}) => ({
  data: [apple, bruno],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
  ...patch,
});

describe('FollowingScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  let mutate;

  beforeEach(() => {
    jest.clearAllMocks();
    mutate = jest.fn();
    // The endless loops are tested on their own below; here the phone "reduces motion"
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    useFollowingPets.mockReturnValue(query());
    useUnfollowPet.mockReturnValue({ mutate, isPending: false, variables: undefined });
  });

  it('uses the app header and goes back', () => {
    const { getAllByText, getByText, getByTestId } = render(<FollowingScreen navigation={navigation} />);

    // The title, and the "Following" label of the first banner stat
    expect(getAllByText('Following')).toHaveLength(2);
    expect(getByText('PETS YOU FOLLOW')).toBeTruthy();
    fireEvent.press(getByTestId('following-back-btn'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('lists each followed pet with its name, level, species, breed and followers', () => {
    const { getByTestId, getByText, queryByTestId } = render(<FollowingScreen navigation={navigation} />);

    expect(getByTestId('following-name-p1').props.children).toBe('Apple');
    expect(getByTestId('following-level-p1')).toBeTruthy();
    expect(getByText('Dog · Golden Retriever · 1 follower')).toBeTruthy();
    // No breed, no level: nothing made up
    expect(getByText('Cat · 3 followers')).toBeTruthy();
    expect(queryByTestId('following-level-p2')).toBeNull();
    expect(getByTestId('following-count').props.children).toBe('Following 2 pets');
  });

  describe('banner numbers', () => {
    beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }));
    afterEach(() => jest.useRealTimers());

    const settle = () => act(() => jest.advanceTimersByTime(1500));

    it('count up to the pack size, the followers and the top level', () => {
      const { getByTestId, getByText } = render(<FollowingScreen navigation={navigation} />);

      expect(getByTestId('following-banner')).toBeTruthy();
      expect(getByText('Pets you follow')).toBeTruthy();
      // They start low and rise
      expect(getByTestId('following-stat-0').props.children).toBeLessThan(2);

      settle();

      expect(getByTestId('following-stat-0').props.children).toBe(2);
      // 1 + 3 followers across the two pets
      expect(getByTestId('following-stat-1').props.children).toBe(4);
      expect(getByTestId('following-stat-2').props.children).toBe(4);
    });

    it('show a dash for the top level when no pet has one', () => {
      useFollowingPets.mockReturnValue(query({ data: [bruno] }));
      const { getByTestId } = render(<FollowingScreen navigation={navigation} />);

      settle();

      expect(getByTestId('following-stat-2').props.children).toBe('-');
    });
  });

  it('shows since when the user followed, and nothing when the date is missing', () => {
    const { getByTestId, queryByTestId } = render(<FollowingScreen navigation={navigation} />);

    expect(getByTestId('following-since-p1').props.children).toBe('Following since Nov 2026');
    expect(queryByTestId('following-since-p2')).toBeNull();
  });

  it('gives every card a turning ring and a shine on View', () => {
    const { getByTestId } = render(<FollowingScreen navigation={navigation} />);

    expect(getByTestId('following-ring-p1')).toBeTruthy();
    expect(getByTestId('following-ring-p2')).toBeTruthy();
    expect(getByTestId('following-shine-p1')).toBeTruthy();
  });

  it("opens a pet's public profile by its slug from View", () => {
    const { getByTestId } = render(<FollowingScreen navigation={navigation} />);

    fireEvent.press(getByTestId('following-view-p1'));

    expect(navigation.navigate).toHaveBeenCalledWith('PublicPetProfileScreen', {
      slug: 'apple-sikarwar',
      entry: apple,
    });
  });

  it('unfollows with the pet id from Unfollow', () => {
    const { getByTestId } = render(<FollowingScreen navigation={navigation} />);

    fireEvent.press(getByTestId('following-unfollow-p2'));

    expect(mutate).toHaveBeenCalledWith('p2', expect.any(Object));
  });

  it('fades the card out when the pet is unfollowed, and does nothing special when it fails', () => {
    const configureNext = jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});
    mutate.mockImplementation((_id, options) => options.onSuccess());
    const { getByTestId } = render(<FollowingScreen navigation={navigation} />);

    fireEvent.press(getByTestId('following-unfollow-p1'));
    expect(configureNext).toHaveBeenCalledTimes(1);

    configureNext.mockClear();
    mutate.mockImplementation((_id, options) => options.onError());
    fireEvent.press(getByTestId('following-unfollow-p2'));
    expect(configureNext).not.toHaveBeenCalled();
    configureNext.mockRestore();
  });

  it('shows progress on the pet being unfollowed and blocks a second tap', () => {
    useUnfollowPet.mockReturnValue({ mutate, isPending: true, variables: 'p1' });
    const { getByTestId, queryByTestId } = render(<FollowingScreen navigation={navigation} />);

    expect(getByTestId('following-busy-p1')).toBeTruthy();
    expect(queryByTestId('following-busy-p2')).toBeNull();
    fireEvent.press(getByTestId('following-unfollow-p1'));
    expect(mutate).not.toHaveBeenCalled();
  });

  it('says so, and keeps the pet, when unfollowing fails', () => {
    mutate.mockImplementation((_id, options) => options.onError(new Error('500')));
    const { getByTestId, getByText } = render(<FollowingScreen navigation={navigation} />);

    fireEvent.press(getByTestId('following-unfollow-p1'));

    expect(getByText("Couldn't unfollow Apple. Please try again.")).toBeTruthy();
    expect(getByTestId('following-card-p1')).toBeTruthy();
  });

  it('shows a loader while the list loads', () => {
    useFollowingPets.mockReturnValue(query({ isLoading: true, data: undefined }));
    const { getByText } = render(<FollowingScreen navigation={navigation} />);

    expect(getByText('Loading the pets you follow…')).toBeTruthy();
  });

  it('has an empty state that points to the leaderboard', () => {
    useFollowingPets.mockReturnValue(query({ data: [] }));
    const { getByTestId, getByText } = render(<FollowingScreen navigation={navigation} />);

    expect(getByText("You're not following any pets yet")).toBeTruthy();
    fireEvent.press(getByTestId('following-explore'));
    expect(navigation.navigate).toHaveBeenCalledWith('LeaderboardScreen');
  });

  it('shows an error with Try again when the list cannot be loaded', () => {
    const refetch = jest.fn();
    useFollowingPets.mockReturnValue(query({ data: undefined, isError: true, refetch }));
    const { getByTestId, getByText } = render(<FollowingScreen navigation={navigation} />);

    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByTestId('following-retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe('petSummaryLine', () => {
  it('joins species, breed and followers, skipping what is missing', () => {
    expect(petSummaryLine({ species: 'dog', breed: 'Pug', followerCount: 1 })).toBe('Dog · Pug · 1 follower');
    expect(petSummaryLine({ species: '', breed: '', followerCount: 0 })).toBe('0 followers');
  });
});

describe('followedSince', () => {
  it('gives month and year, and nothing for a missing or broken date', () => {
    expect(followedSince('2026-03-05T10:00:00Z')).toMatch(/^Mar 2026$/);
    expect(followedSince('')).toBe('');
    expect(followedSince(undefined)).toBe('');
    expect(followedSince('not a date')).toBe('');
  });
});

describe('live motion', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  const flush = () => act(async () => {});
  let handles;

  beforeEach(() => {
    jest.clearAllMocks();
    handles = [];
    useFollowingPets.mockReturnValue(query());
    useUnfollowPet.mockReturnValue({ mutate: jest.fn(), isPending: false, variables: undefined });
    // A stand-in for Animated.loop: counts the loops and their start and stop
    jest.spyOn(Animated, 'loop').mockImplementation(() => {
      const handle = { start: jest.fn(), stop: jest.fn() };
      handles.push(handle);
      return handle;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  // The page header and the soft background have loops of their own, so the screen's loops are
  // counted as the difference between "motion on" and "reduce motion"
  const loopsWith = async ({ reduced, closeEarly = false }) => {
    handles = [];
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(reduced);
    const view = render(<FollowingScreen navigation={navigation} />);
    if (closeEarly) {
      view.unmount();
      await flush();
      return { count: handles.length, started: handles };
    }
    await flush();
    const result = { count: handles.length, started: [...handles], view };
    return result;
  };

  it('keeps moving by itself: four loops (pulse, ring, shine, banner glow)', async () => {
    const still = await loopsWith({ reduced: true });
    still.view.unmount();
    const moving = await loopsWith({ reduced: false });

    expect(moving.count - still.count).toBe(4);
    const own = moving.started.filter(handle => handle.start.mock.calls.length === 1);
    expect(own.length).toBeGreaterThanOrEqual(4);
  });

  it('adds no loop at all when the phone is set to reduce motion', async () => {
    const reduced = await loopsWith({ reduced: true });
    reduced.view.unmount();
    const moving = await loopsWith({ reduced: false });

    expect(reduced.count).toBeLessThan(moving.count);
  });

  it('stops its loops when the screen closes', async () => {
    const moving = await loopsWith({ reduced: false });
    moving.view.unmount();

    const stopped = moving.started.filter(handle => handle.stop.mock.calls.length > 0);
    expect(stopped.length).toBeGreaterThanOrEqual(4);
  });

  it('does not start a loop if the screen closes before the setting is read', async () => {
    const still = await loopsWith({ reduced: true });
    still.view.unmount();
    const early = await loopsWith({ reduced: false, closeEarly: true });

    // Only the loops that do not wait for the setting started
    expect(early.count).toBe(still.count);
  });
});

describe('CountUp', () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }));
  afterEach(() => jest.useRealTimers());

  const settle = () => act(() => jest.advanceTimersByTime(1500));

  it('starts at zero, rises, and stops on the exact value', () => {
    const { getByTestId } = render(<CountUp value={12} testID="n" />);
    expect(getByTestId('n').props.children).toBe(0);

    act(() => jest.advanceTimersByTime(380));
    const midway = getByTestId('n').props.children;
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(12);

    settle();
    expect(getByTestId('n').props.children).toBe(12);
  });

  it('counts again to a new value, and shows text as it is', () => {
    const { getByTestId, rerender } = render(<CountUp value={4} testID="n" />);
    settle();
    expect(getByTestId('n').props.children).toBe(4);

    rerender(<CountUp value={1} testID="n" />);
    settle();
    expect(getByTestId('n').props.children).toBe(1);

    rerender(<CountUp value="-" testID="n" />);
    expect(getByTestId('n').props.children).toBe('-');
  });
});
