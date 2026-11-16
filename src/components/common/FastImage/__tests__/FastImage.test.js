import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import FastImage from '../index';

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
});
