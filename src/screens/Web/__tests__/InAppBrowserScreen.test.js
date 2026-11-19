import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { InAppBrowserScreen } from '../InAppBrowserScreen';

const mockNavigation = { goBack: jest.fn() };
const URL = 'https://example.com/community-guidelines';
const route = { params: { url: URL, title: 'Community guidelines' } };

let mockWebViewProps;
let mockWebViewMethods;
let mockWebViewAvailable = true;

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = React.forwardRef((props, ref) => {
    mockWebViewProps = props;
    React.useImperativeHandle(ref, () => mockWebViewMethods);
    return React.createElement(View, { testID: 'webview' });
  });
  return {
    get WebView() {
      if (!mockWebViewAvailable) {
        throw new Error('native module missing');
      }
      return WebView;
    },
  };
});

describe('InAppBrowserScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebViewAvailable = true;
    mockWebViewMethods = { goBack: jest.fn(), reload: jest.fn() };
  });

  it('loads the page inside a WebView with the title and host in the header', () => {
    const { getByText, getByTestId } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    expect(getByTestId('webview')).toBeTruthy();
    expect(mockWebViewProps.source).toEqual({ uri: URL });
    expect(getByText('Community guidelines')).toBeTruthy();
    expect(getByText('example.com')).toBeTruthy();
  });

  it('hides the requested parts of the website before and after the page loads', () => {
    const hidingRoute = {
      params: { url: URL, title: 'Community guidelines', hideSelectors: ['header', '.pfp-chat-wrapper'] },
    };
    render(<InAppBrowserScreen navigation={mockNavigation} route={hidingRoute} />);

    for (const script of [mockWebViewProps.injectedJavaScriptBeforeContentLoaded, mockWebViewProps.injectedJavaScript]) {
      expect(script).toContain('header,.pfp-chat-wrapper{display:none !important}');
      expect(script.trim().endsWith('true;')).toBe(true);
    }
  });

  it('injects nothing when no selectors are given', () => {
    render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    expect(mockWebViewProps.injectedJavaScriptBeforeContentLoaded).toBeUndefined();
    expect(mockWebViewProps.injectedJavaScript).toBeUndefined();
  });

  it('closes the screen with the header button when there is no page history', () => {
    const { getByLabelText } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    fireEvent.press(getByLabelText('Close'));

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    expect(mockWebViewMethods.goBack).not.toHaveBeenCalled();
  });

  it('goes back inside the page first when the WebView has history', () => {
    const { getByLabelText } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    act(() => mockWebViewProps.onNavigationStateChange({ canGoBack: true, title: 'Page two' }));
    fireEvent.press(getByLabelText('Back'));

    expect(mockWebViewMethods.goBack).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });

  it('reloads the page from the header', () => {
    const { getByLabelText } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    fireEvent.press(getByLabelText('Reload'));

    expect(mockWebViewMethods.reload).toHaveBeenCalledTimes(1);
  });

  it('shows a retryable error when the page fails to load', () => {
    const { getByText } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    act(() => mockWebViewProps.onError());

    expect(getByText('Could not load this page')).toBeTruthy();
    fireEvent.press(getByText('Try again'));
    expect(() => getByText('Could not load this page')).toThrow();
  });

  it('falls back to the system browser when the native WebView is not available', () => {
    mockWebViewAvailable = false;
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByText, queryByTestId } = render(<InAppBrowserScreen navigation={mockNavigation} route={route} />);

    expect(queryByTestId('webview')).toBeNull();
    fireEvent.press(getByText('Open in browser'));

    expect(openURL).toHaveBeenCalledWith(URL);
    openURL.mockRestore();
  });
});
