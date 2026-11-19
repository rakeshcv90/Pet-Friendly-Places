import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { TailsGuideScreen } from '../TailsGuideScreen';

// Mock chatApi functions
jest.mock('../../../services/api/chatApi', () => ({
  getChatStatus: jest.fn().mockResolvedValue({ enabled: true }),
  createChatSession: jest.fn().mockResolvedValue({
    session: { session_token: 'mock-session-token' },
  }),
  selectChatPersona: jest.fn().mockResolvedValue({ success: true }),
  postChatMessage: jest.fn().mockResolvedValue({
    aiMessage: { content: 'Verified test pet response.' },
    pills: ['Plan a road trip', 'Find pet-friendly stays'],
  }),
  getChatMessages: jest.fn().mockResolvedValue({ messages: [] }),
  createClientMessageId: jest.fn().mockReturnValue('mock-client-id-123'),
}));

describe('TailsGuideScreen Component', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Screen 1 (Pre-Chat Contact Form) with title, prefilled inputs, and Start AI chat button', async () => {
    const { getByText, getByTestId } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Tails Guide AI')).toBeTruthy();
    });

    // Intro text
    expect(
      getByText('Ask Tails Guide AI about pet-friendly places. This chat is linked to your account.')
    ).toBeTruthy();

    // Field labels and inputs
    expect(getByText('YOUR NAME')).toBeTruthy();
    expect(getByTestId('contact-name-input').props.value).toBe('Rakesh Rao');

    expect(getByText('EMAIL')).toBeTruthy();
    expect(getByTestId('contact-email-input').props.value).toBe('rakeshrao@cvinfotech.com');

    expect(getByText('WHATSAPP NUMBER')).toBeTruthy();
    expect(getByTestId('contact-whatsapp-input').props.placeholder).toBe('Optional');

    // Action buttons
    expect(getByTestId('start-ai-chat-btn')).toBeTruthy();
    expect(getByText('Start AI chat →')).toBeTruthy();
    expect(getByTestId('continue-without-details-btn')).toBeTruthy();
    expect(getByText('Continue without extra contact details')).toBeTruthy();
  });

  it('calls navigation.goBack when back button or close button is pressed on Screen 1', async () => {
    const { getByTestId, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(getByText('Tails Guide AI')).toBeTruthy();
    });

    fireEvent.press(getByTestId('tails-guide-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('tails-guide-close-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(2);
  });

  it('navigates to Screen 2 (Chat Screen) when Start AI chat is clicked', async () => {
    const { getByTestId, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('start-ai-chat-btn'));
    });

    // Top banner
    expect(getByTestId('update-contact-details-btn')).toBeTruthy();
    expect(getByText('Update contact details')).toBeTruthy();

    // Welcome message
    expect(getByText('Tails Guide · AI')).toBeTruthy();
    expect(
      getByText(/Hello, I am Tails Guide AI. Choose Pet Parent or Place Owner to get started/)
    ).toBeTruthy();

    // Persona card
    expect(getByText('Choose how Tails Guide can help')).toBeTruthy();
    expect(getByTestId('persona-pet-parent-btn')).toBeTruthy();
    expect(getByTestId('persona-place-owner-btn')).toBeTruthy();

    // Input area
    expect(getByTestId('tails-guide-input')).toBeTruthy();
    expect(getByTestId('tails-guide-send-btn')).toBeTruthy();
  });

  it('navigates back to Screen 1 when Update contact details is clicked on Screen 2', async () => {
    const { getByTestId, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    // Navigate to Chat Screen
    await act(async () => {
      fireEvent.press(getByTestId('start-ai-chat-btn'));
    });
    expect(getByText('Update contact details')).toBeTruthy();

    // Tap Update contact details
    fireEvent.press(getByTestId('update-contact-details-btn'));

    // Should be back on Screen 1
    expect(getByText('YOUR NAME')).toBeTruthy();
    expect(getByTestId('start-ai-chat-btn')).toBeTruthy();
  });

  it('allows selecting Pet Parent persona and receives personalized AI introduction', async () => {
    const { getByTestId, getAllByText, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('start-ai-chat-btn'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('persona-pet-parent-btn'));
    });

    await waitFor(() => {
      expect(getAllByText('Pet Parent').length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(
      () => {
        expect(
          getByText(/Welcome, fellow pet parent! 🐾 I can help you find verified pet-friendly cafes/)
        ).toBeTruthy();
      },
      { timeout: 1500 }
    );
  });

  it('allows selecting Place Owner persona and receives business partner AI introduction', async () => {
    const { getByTestId, getAllByText, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('start-ai-chat-btn'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('persona-place-owner-btn'));
    });

    await waitFor(() => {
      expect(getAllByText('Place Owner').length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(
      () => {
        expect(
          getByText(/Welcome, place partner! 🏢 I can help you with listing your pet-friendly property/)
        ).toBeTruthy();
      },
      { timeout: 1500 }
    );
  });

  it('allows sending a chat message and receives a response', async () => {
    const { getByTestId, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('start-ai-chat-btn'));
    });

    fireEvent.changeText(getByTestId('tails-guide-input'), 'Can I plan a road trip with my dog?');

    await act(async () => {
      fireEvent.press(getByTestId('tails-guide-send-btn'));
    });

    expect(getByText('Can I plan a road trip with my dog?')).toBeTruthy();

    await waitFor(
      () => {
        expect(getByText('Verified test pet response.')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it('transitions to chat screen when clicking Continue without extra contact details', async () => {
    const { getByTestId, getByText } = render(
      <TailsGuideScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('continue-without-details-btn'));
    });

    expect(getByText('Update contact details')).toBeTruthy();
    expect(getByText('Tails Guide · AI')).toBeTruthy();
  });
});
