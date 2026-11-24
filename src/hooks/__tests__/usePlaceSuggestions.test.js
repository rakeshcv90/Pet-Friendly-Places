import { renderHook, act } from '@testing-library/react-native';
import { usePlaceSuggestions, SUGGEST_DELAY_MS } from '../usePlaceSuggestions';
import { fetchLocationSuggestions as fetchPlaceSuggestions } from '../../services/urbania/urbaniaApi';

jest.mock('../../services/urbania/urbaniaApi', () => ({
  ...jest.requireActual('../../services/urbania/urbaniaApi'),
  fetchLocationSuggestions: jest.fn(),
}));

const PLACE = { id: 'a', title: 'Goa', subtitle: 'India', description: 'Goa, India' };

describe('usePlaceSuggestions', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
    fetchPlaceSuggestions.mockReset();
    fetchPlaceSuggestions.mockResolvedValue([PLACE]);
  });
  afterEach(() => jest.useRealTimers());

  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(SUGGEST_DELAY_MS + 10);
    });
  };

  it('waits for a pause in typing before asking, and then shows the suggestions', async () => {
    const { result } = renderHook(() => usePlaceSuggestions('Goa', true));

    expect(fetchPlaceSuggestions).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
    await settle();
    expect(fetchPlaceSuggestions).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual([PLACE]);
    expect(result.current.loading).toBe(false);
  });

  it('asks once for fast typing, using only the last text', async () => {
    const { rerender } = renderHook(({ text }) => usePlaceSuggestions(text, true), {
      initialProps: { text: 'Goa' },
    });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    rerender({ text: 'Goa b' });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    rerender({ text: 'Goa beach' });
    await settle();

    expect(fetchPlaceSuggestions).toHaveBeenCalledTimes(1);
    expect(fetchPlaceSuggestions.mock.calls[0][0]).toBe('Goa beach');
  });

  it('does not ask for text that is too short, or when the box is not being typed in', async () => {
    const short = renderHook(() => usePlaceSuggestions('Go', true));
    const idle = renderHook(() => usePlaceSuggestions('Goa', false));
    await settle();

    expect(fetchPlaceSuggestions).not.toHaveBeenCalled();
    expect(short.result.current.items).toEqual([]);
    expect(idle.result.current.items).toEqual([]);
  });

  it('clears the suggestions when the box is left', async () => {
    const { result, rerender } = renderHook(({ active }) => usePlaceSuggestions('Goa', active), {
      initialProps: { active: true },
    });
    await settle();
    expect(result.current.items).toHaveLength(1);

    rerender({ active: false });
    expect(result.current.items).toEqual([]);
  });

  it('ignores an answer that arrives after the text has changed', async () => {
    let answerLate;
    fetchPlaceSuggestions.mockImplementationOnce(
      () => new Promise(resolve => (answerLate = () => resolve([PLACE]))),
    );
    const { result, rerender } = renderHook(({ text }) => usePlaceSuggestions(text, true), {
      initialProps: { text: 'Goa' },
    });
    await settle();
    rerender({ text: 'G' });
    await act(async () => {
      answerLate();
    });

    expect(result.current.items).toEqual([]);
  });

  it('does not search again for the place that was just picked', async () => {
    const { result, rerender } = renderHook(({ text }) => usePlaceSuggestions(text, true), {
      initialProps: { text: 'Goa' },
    });
    await settle();

    act(() => result.current.choose('Goa, India'));
    expect(result.current.items).toEqual([]);
    rerender({ text: 'Goa, India' });
    await settle();
    expect(fetchPlaceSuggestions).toHaveBeenCalledTimes(1);

    // Typing something new searches again
    rerender({ text: 'Goa airport' });
    await settle();
    expect(fetchPlaceSuggestions).toHaveBeenCalledTimes(2);
  });

  it('stops quietly when it is removed while waiting', () => {
    const { unmount } = renderHook(() => usePlaceSuggestions('Goa', true));
    unmount();
    expect(() => jest.advanceTimersByTime(SUGGEST_DELAY_MS * 2)).not.toThrow();
    expect(fetchPlaceSuggestions).not.toHaveBeenCalled();
  });
});
