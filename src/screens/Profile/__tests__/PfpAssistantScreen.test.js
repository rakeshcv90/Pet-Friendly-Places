import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PfpAssistantScreen } from '../PfpAssistantScreen';

// Mock supportChatApi
jest.mock('../../../services/api/supportChatApi', () => ({
  askPfpAssistant: jest.fn().mockResolvedValue('Here are verified pet-friendly places in Goa!'),
  submitSupportTranscript: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock storage
jest.mock('../../../services/storage/storage', () => ({
  getItem: jest.fn().mockReturnValue('mock-access-token'),
  STORAGE_KEYS: { ACCESS_TOKEN: 'ACCESS_TOKEN' },
}));

describe('PfpAssistantScreen Component', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders PfpAssistantScreen with header title, subtitle, initial greeting, input, and end chat button', async () => {
    const { getByText, getByTestId } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    // Header elements
    expect(getByText('PFP Assistant')).toBeTruthy();
    expect(getByText('Powered by AI')).toBeTruthy();
    expect(getByTestId('pfp-assistant-close-btn')).toBeTruthy();

    // Initial greeting
    expect(
      getByText("Hi! I'm the PFP AI assistant. What would you like to know about Pet Friendly Places?")
    ).toBeTruthy();

    // Input & Actions
    expect(getByTestId('pfp-assistant-input')).toBeTruthy();
    expect(getByTestId('pfp-assistant-send-btn')).toBeTruthy();
    expect(getByTestId('pfp-assistant-end-chat-btn')).toBeTruthy();
    expect(getByText('End Chat')).toBeTruthy();
  });

  it('calls navigation.goBack directly when close button is pressed without asking questions', () => {
    const { getByTestId } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('pfp-assistant-close-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('allows user to type, send a message, and receive an assistant reply', async () => {
    const { getByTestId, getByText } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('pfp-assistant-input'), 'Are there pet stays in Goa?');

    await act(async () => {
      fireEvent.press(getByTestId('pfp-assistant-send-btn'));
    });

    expect(getByText('Are there pet stays in Goa?')).toBeTruthy();

    await waitFor(
      () => {
        expect(getByText(/Here are verified pet-friendly places in Goa!/)).toBeTruthy();
      },
      { timeout: 1500 }
    );
  });

  it('displays the compact paw typing animation indicator while assistant is replying', async () => {
    let resolveAssistant;
    const { askPfpAssistant } = require('../../../services/api/supportChatApi');
    askPfpAssistant.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveAssistant = resolve;
        })
    );

    const { getByTestId, queryByTestId } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('pfp-assistant-input'), 'Tell me about dog parks');

    await act(async () => {
      fireEvent.press(getByTestId('pfp-assistant-send-btn'));
    });

    expect(getByTestId('pfp-assistant-typing-indicator')).toBeTruthy();

    await act(async () => {
      resolveAssistant('Here are verified dog parks!');
    });

    await waitFor(() => {
      expect(queryByTestId('pfp-assistant-typing-indicator')).toBeNull();
    });
  });

  it('shows "Before you go" modal (Image 1) when user has asked a question and closes chat, then shows 3rd screen (Image 3) on rating', async () => {
    const { getByTestId, getByText } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    // 1. User asks a question
    fireEvent.changeText(getByTestId('pfp-assistant-input'), 'Can I bring my beagle?');
    await act(async () => {
      fireEvent.press(getByTestId('pfp-assistant-send-btn'));
    });

    // 2. User tries to cut/close the chat screen
    fireEvent.press(getByTestId('pfp-assistant-close-btn'));

    // 3. Before you go modal (Image 1) is displayed
    expect(getByTestId('pfp-feedback-modal-rate')).toBeTruthy();
    expect(getByText('Before you go')).toBeTruthy();
    expect(getByText('Rate this conversation')).toBeTruthy();
    expect(getByText('Was your query resolved?')).toBeTruthy();
    expect(getByTestId('feedback-yes-btn')).toBeTruthy();
    expect(getByTestId('feedback-no-btn')).toBeTruthy();

    // 4. User clicks "Yes, resolved" button -> shows 3rd screen (Image 3)
    await act(async () => {
      fireEvent.press(getByTestId('feedback-yes-btn'));
    });

    expect(getByTestId('pfp-feedback-modal-thanks')).toBeTruthy();
    expect(getByText('Thanks for your feedback!')).toBeTruthy();

    // 5. After delay, modal completes exit
    await waitFor(
      () => {
        expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });

  it('allows closing the "Before you go" modal via its close button to exit directly', async () => {
    const { getByTestId } = render(
      <PfpAssistantScreen navigation={mockNavigation} />
    );

    // User asks a question
    fireEvent.changeText(getByTestId('pfp-assistant-input'), 'Where are cat clinics?');
    await act(async () => {
      fireEvent.press(getByTestId('pfp-assistant-send-btn'));
    });

    // User cuts the chat via End Chat button
    fireEvent.press(getByTestId('pfp-assistant-end-chat-btn'));

    // Modal is shown
    expect(getByTestId('pfp-feedback-modal-rate')).toBeTruthy();

    // User presses close on modal
    await act(async () => {
      fireEvent.press(getByTestId('feedback-modal-close-btn'));
    });

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
