import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlayableVideo } from '../GalleryVideo';

const renderVideo = (active = true) =>
  render(<PlayableVideo uri="https://site.test/clip.mp4" active={active} testID="clip" />);

describe('PlayableVideo loader', () => {
  it('shows a loader as soon as the video opens, so it is clear something is happening', () => {
    const { getByTestId, getByText } = renderVideo();
    expect(getByTestId('clip-loading')).toBeTruthy();
    expect(getByText('Loading video...')).toBeTruthy();
  });

  it('hides the loader once the video is ready', () => {
    const { getByTestId, queryByTestId } = renderVideo();
    fireEvent(getByTestId('clip'), 'load', { duration: 5 });
    expect(queryByTestId('clip-loading')).toBeNull();
  });

  it('hides the loader when the first frame is ready', () => {
    const { getByTestId, queryByTestId } = renderVideo();
    fireEvent(getByTestId('clip'), 'readyForDisplay');
    expect(queryByTestId('clip-loading')).toBeNull();
  });

  it('shows the loader again while the video waits for more data, then hides it', () => {
    const { getByTestId, queryByTestId } = renderVideo();
    fireEvent(getByTestId('clip'), 'load', { duration: 5 });
    expect(queryByTestId('clip-loading')).toBeNull();

    fireEvent(getByTestId('clip'), 'buffer', { isBuffering: true });
    expect(getByTestId('clip-loading')).toBeTruthy();
    fireEvent(getByTestId('clip'), 'buffer', { isBuffering: false });
    expect(queryByTestId('clip-loading')).toBeNull();
  });

  it('does not show a loader on a page that is not on screen', () => {
    const { queryByTestId } = renderVideo(false);
    expect(queryByTestId('clip-loading')).toBeNull();
  });

  it('replaces the loader with the failure message, and shows it again after Try again', () => {
    const { getByTestId, queryByTestId, getByText } = renderVideo();
    fireEvent(getByTestId('clip'), 'error', {});
    expect(queryByTestId('clip-loading')).toBeNull();
    expect(getByText("This video can't be played right now")).toBeTruthy();

    fireEvent.press(getByTestId('clip-retry'));
    expect(getByTestId('clip-loading')).toBeTruthy();
  });
});
