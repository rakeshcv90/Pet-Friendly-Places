import React from 'react';
import { Image } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import FastImage, { prefetchImages } from '../index';

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

    it('falls back to the "no image" picture and reports onError when it fails', () => {
      const onError = jest.fn();
      const { UNSAFE_getByType, getByTestId, queryByTestId } = render(
        <FastImage source={remote} style={{ width: 100, height: 100 }} onError={onError} />,
      );
      fireEvent(UNSAFE_getByType(Image), 'error', { nativeEvent: {} });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(getByTestId('fast-image-fallback')).toBeTruthy();
      expect(queryByTestId('fast-image-placeholder')).toBeNull();
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
