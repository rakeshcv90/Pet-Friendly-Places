import React from 'react';
import { Image } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import FastImage, { prefetchImages, MAX_RETRIES, RETRY_DELAY_MS } from '../index';

describe('FastImage (React Native Image underneath)', () => {
  it('keeps the constants screens read', () => {
    expect(FastImage.resizeMode.cover).toBe('cover');
    expect(FastImage.resizeMode.contain).toBe('contain');
    expect(FastImage.priority.high).toBe('high');
  });

  it('draws a web picture and drops the options only FastImage understood', () => {
    const { UNSAFE_getByType } = render(
      <FastImage
        source={{
          uri: 'https://example.com/a.jpg',
          priority: 'high',
          cache: 'web',
          headers: { a: '1' },
        }}
        resizeMode={FastImage.resizeMode.contain}
        style={{ width: 10, height: 10 }}
      />,
    );

    const image = UNSAFE_getByType(Image);
    expect(image.props.source).toEqual({ uri: 'https://example.com/a.jpg', headers: { a: '1' } });
    expect(image.props.resizeMode).toBe('contain');
  });

  it('draws a bundled image (a require) as it is', () => {
    const { UNSAFE_getByType } = render(
      <FastImage source={1234} style={{ width: 10, height: 10 }} />,
    );

    expect(UNSAFE_getByType(Image).props.source).toBe(1234);
  });

  it('forwards its ref, so it can be animated', () => {
    const ref = React.createRef();
    render(<FastImage ref={ref} source={1234} />);

    expect(ref.current).toBeTruthy();
  });

  describe('web pictures', () => {
    const remote = { uri: 'https://example.com/a.jpg' };

    it('shows a placeholder while the picture downloads', () => {
      const { getByTestId } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} />,
      );
      expect(getByTestId('fast-image-placeholder')).toBeTruthy();
    });

    it('removes the placeholder and reports onLoad once the picture is ready', () => {
      const onLoad = jest.fn();
      const { UNSAFE_getByType, queryByTestId } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} onLoad={onLoad} />,
      );
      fireEvent(UNSAFE_getByType(Image), 'load', { nativeEvent: {} });

      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(queryByTestId('fast-image-placeholder')).toBeNull();
    });

    it('tries again after a failure, and only then falls back to the "no image" picture', () => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
      const onError = jest.fn();
      const { UNSAFE_getByType, getByTestId, queryByTestId, unmount } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} onError={onError} />,
      );

      // First and second failures: the placeholder stays, nothing is reported, it asks again
      for (let i = 0; i < MAX_RETRIES; i += 1) {
        fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });
        expect(onError).not.toHaveBeenCalled();
        expect(getByTestId('fast-image-placeholder')).toBeTruthy();
        act(() => {
          jest.advanceTimersByTime(RETRY_DELAY_MS * (i + 1));
        });
      }

      // The last try fails too
      fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });
      expect(onError).toHaveBeenCalledTimes(1);
      expect(getByTestId('fast-image-fallback')).toBeTruthy();
      expect(queryByTestId('fast-image-placeholder')).toBeNull();
      unmount();
      jest.useRealTimers();
    });

    it('shows the picture when a retry succeeds', () => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
      const onError = jest.fn();
      const onLoad = jest.fn();
      const { UNSAFE_getByType, queryByTestId, unmount } = render(
        <FastImage
          source={remote}
          style={{ width: 100, height: 100 }}
          onError={onError}
          onLoad={onLoad}
        />,
      );
      fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });
      act(() => {
        jest.advanceTimersByTime(RETRY_DELAY_MS);
      });
      fireEvent(UNSAFE_getByType(Image), 'load', { nativeEvent: {} });

      expect(onError).not.toHaveBeenCalled();
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(queryByTestId('fast-image-placeholder')).toBeNull();
      expect(queryByTestId('fast-image-fallback')).toBeNull();
      unmount();
      jest.useRealTimers();
    });

    it('loads our own uploads as a resized copy, like the website', () => {
      const photo = 'https://petfriendlyplaces.in/api/storage/objects/uploads/abc-123';
      const { UNSAFE_getByType } = render(
        <FastImage source={{ uri: photo }} style={{ width: '100%', height: 100 }} />,
      );
      const uri = UNSAFE_getByType(Image).props.source.uri;
      expect(uri).toBe(
        'https://petfriendlyplaces.in/_next/image?url=%2Fapi%2Fstorage%2Fobjects%2Fuploads%2Fabc-123&w=1080&q=75',
      );
    });

    it('asks for the smallest copy for a small picture', () => {
      const photo = 'https://petfriendlyplaces.in/api/storage/objects/uploads/abc-123';
      const { UNSAFE_getByType } = render(
        <FastImage source={{ uri: photo }} style={{ width: 72, height: 72 }} />,
      );
      expect(UNSAFE_getByType(Image).props.source.uri).toContain('&w=640&');
    });

    it('does not change other addresses', () => {
      const { UNSAFE_getByType } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} />,
      );
      expect(UNSAFE_getByType(Image).props.source.uri).toBe(remote.uri);
    });

    it('falls back to the original address if the resized copy keeps failing', () => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
      const photo = 'https://petfriendlyplaces.in/api/storage/objects/uploads/abc-123';
      const onError = jest.fn();
      const { UNSAFE_getByType, unmount } = render(
        <FastImage source={{ uri: photo }} style={{ width: 100, height: 100 }} onError={onError} />,
      );
      for (let i = 0; i < MAX_RETRIES; i += 1) {
        fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });
        act(() => {
          jest.advanceTimersByTime(RETRY_DELAY_MS * (i + 1));
        });
      }
      // Last resized try fails: the original is requested, and nothing is reported yet
      fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });
      expect(onError).not.toHaveBeenCalled();
      expect(UNSAFE_getByType(Image).props.source.uri).toBe(photo);
      unmount();
      jest.useRealTimers();
    });

    it('asks Android to decode web pictures at the size they are drawn, not at full size', () => {
      const { UNSAFE_getByType } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} />,
      );
      expect(UNSAFE_getByType(Image).props.resizeMethod).toBe('resize');
    });

    it('starts again from the placeholder when the picture changes', () => {
      const { UNSAFE_getByType, queryByTestId, rerender } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} />,
      );
      fireEvent(UNSAFE_getByType(Image), 'load', { nativeEvent: {} });
      expect(queryByTestId('fast-image-placeholder')).toBeNull();

      rerender(
        <FastImage source={{ uri: 'https://example.com/b.jpg' }} style={{ width: 100, height: 100 }} />,
      );
      expect(queryByTestId('fast-image-placeholder')).toBeTruthy();
    });

    it('draws a local photo (just picked) without a placeholder', () => {
      const { queryByTestId, UNSAFE_getByType } = render(
        <FastImage source={{ uri: 'file:///photo.jpg' }} style={{ width: 10, height: 10 }} />,
      );
      expect(queryByTestId('fast-image-placeholder')).toBeNull();
      expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'file:///photo.jpg' });
    });
  });

  describe('prefetchImages', () => {
    it('prefetches each web picture once and ignores everything else', () => {
      const spy = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
      prefetchImages(['https://a/1.jpg', 'https://a/1.jpg', 'file:///x.jpg', null, 'https://a/2.jpg']);
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('never throws when prefetching fails', () => {
      const spy = jest.spyOn(Image, 'prefetch').mockRejectedValue(new Error('offline'));
      expect(() => prefetchImages(['https://a/1.jpg'])).not.toThrow();
      spy.mockRestore();
    });
  });
});
