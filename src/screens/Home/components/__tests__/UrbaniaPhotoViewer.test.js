import React from 'react';
import { BackHandler, Dimensions, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { UrbaniaPhotoViewer } from '../UrbaniaPhotoViewer';
import { GALLERY_LABELS, GALLERY_RATIOS } from '../UrbaniaSections';
import { theme } from '../../../../theme';

const setup = (index = 0) => {
  const onIndexChange = jest.fn();
  const onClose = jest.fn();
  const view = render(
    <UrbaniaPhotoViewer index={index} onIndexChange={onIndexChange} onClose={onClose} />,
  );
  return { ...view, onIndexChange, onClose };
};

describe('UrbaniaPhotoViewer', () => {
  it('shows every photo and says which one it is on', () => {
    const { getByTestId, getByText } = setup(0);

    expect(theme.images.urbaniaGallery).toHaveLength(5);
    for (let i = 0; i < 5; i += 1) {
      expect(getByTestId(`urbania-viewer-photo-${i}`).props.source).toBe(
        theme.images.urbaniaGallery[i],
      );
    }
    expect(getByTestId('urbania-viewer-counter').props.children).toBe('1 / 5');
    expect(getByText(GALLERY_LABELS[0])).toBeTruthy();
  });

  it('draws each photo whole, at an exact size in its own shape, centred on the screen', () => {
    const { getByTestId } = setup(0);
    const { width, height } = Dimensions.get('window');

    for (let i = 0; i < 5; i += 1) {
      const photo = getByTestId(`urbania-viewer-photo-${i}`);
      const style = StyleSheet.flatten(photo.props.style);

      expect(photo.props.resizeMode).toBe('stretch');
      expect(style.width).toBeLessThanOrEqual(width + 1e-6);
      expect(style.height).toBeLessThanOrEqual(height + 1e-6);
      expect(style.width / style.height).toBeCloseTo(GALLERY_RATIOS[i], 3);
      expect(style.left).toBeGreaterThanOrEqual(-1e-6);
      expect(style.top).toBeGreaterThanOrEqual(-1e-6);
    }
  });

  it('opens on the photo it is given', () => {
    const { getByTestId, getByText } = setup(3);

    expect(getByTestId('urbania-viewer-counter').props.children).toBe('4 / 5');
    expect(getByText(GALLERY_LABELS[3])).toBeTruthy();
  });

  it('goes to the next photo', () => {
    const { getByTestId, onIndexChange } = setup(0);

    fireEvent.press(getByTestId('urbania-viewer-next'));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('goes to the previous photo', () => {
    const { getByTestId, onIndexChange } = setup(2);

    fireEvent.press(getByTestId('urbania-viewer-prev'));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('cannot go before the first photo', () => {
    const { getByTestId, onIndexChange } = setup(0);

    const prev = getByTestId('urbania-viewer-prev');
    expect(prev.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(prev);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('cannot go past the last photo', () => {
    const { getByTestId, onIndexChange } = setup(4);

    const next = getByTestId('urbania-viewer-next');
    expect(next.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(next);
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(getByTestId('urbania-viewer-prev').props.accessibilityState.disabled).toBe(false);
  });

  it('follows a swipe to another photo', () => {
    const { getByTestId, onIndexChange } = setup(0);
    const { width } = Dimensions.get('window');

    fireEvent(getByTestId('urbania-viewer-list'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: width * 3 } },
    });
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it('ignores a swipe that ends on the photo it already shows', () => {
    const { getByTestId, onIndexChange } = setup(2);
    const { width } = Dimensions.get('window');

    fireEvent(getByTestId('urbania-viewer-list'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: width * 2 } },
    });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('shows all the photos together as a row of thumbnails, with the current one marked', () => {
    const { getByTestId } = setup(2);

    for (let i = 0; i < 5; i += 1) {
      expect(getByTestId(`urbania-viewer-thumb-${i}`).props.accessibilityState.selected).toBe(
        i === 2,
      );
    }
  });

  it('jumps to a photo when its thumbnail is tapped', () => {
    const { getByTestId, onIndexChange } = setup(0);

    fireEvent.press(getByTestId('urbania-viewer-thumb-3'));
    expect(onIndexChange).toHaveBeenCalledWith(3);
  });

  it('does nothing when the thumbnail of the photo already shown is tapped', () => {
    const { getByTestId, onIndexChange } = setup(1);

    fireEvent.press(getByTestId('urbania-viewer-thumb-1'));
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('closes from the close button', () => {
    const { getByTestId, onClose } = setup(1);

    fireEvent.press(getByTestId('urbania-viewer-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes, instead of leaving the screen, on the Android back button', () => {
    const remove = jest.fn();
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockReturnValue({ remove });
    const { onClose, unmount } = setup(0);

    const [event, handler] = spy.mock.calls[0];
    expect(event).toBe('hardwareBackPress');
    expect(handler()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(remove).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('describes every photo for screen readers', () => {
    const { getByTestId } = setup(0);

    GALLERY_LABELS.forEach((label, i) => {
      expect(getByTestId(`urbania-viewer-photo-${i}`).props.accessibilityLabel).toBe(label);
    });
  });
});
