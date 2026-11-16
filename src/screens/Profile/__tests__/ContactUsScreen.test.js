import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ContactUsScreen } from '../ContactUsScreen';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
}));

describe('ContactUsScreen Component', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Contact Us screen with header, topics, direct channels, and form inputs', () => {
    const { getByText, getByTestId } = render(
      <ContactUsScreen navigation={mockNavigation} />
    );

    expect(getByText('Contact Pet Friendly Places')).toBeTruthy();
    expect(getByText('Use this page to contact us about:')).toBeTruthy();
    expect(getByText('Reach us directly')).toBeTruthy();
    expect(getByText('Instagram')).toBeTruthy();
    expect(getByText('YouTube')).toBeTruthy();
    expect(getByText('Facebook')).toBeTruthy();
    expect(getByText('Send us a message')).toBeTruthy();

    expect(getByTestId('contact-name-input')).toBeTruthy();
    expect(getByTestId('contact-email-input')).toBeTruthy();
    expect(getByTestId('contact-phone-input')).toBeTruthy();
    expect(getByTestId('contact-reason-picker')).toBeTruthy();
    expect(getByTestId('contact-url-input')).toBeTruthy();
    expect(getByTestId('contact-message-input')).toBeTruthy();
    expect(getByTestId('contact-submit-btn')).toBeTruthy();
    expect(getByText('hello@petfriendlyplaces.in')).toBeTruthy();
  });

  it('calls goBack when top back button is pressed', () => {
    const { getByTestId } = render(
      <ContactUsScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('contact-us-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('validates required fields on submission', () => {
    const { getByTestId, getByText } = render(
      <ContactUsScreen navigation={mockNavigation} />
    );

    // Empty submission
    fireEvent.press(getByTestId('contact-submit-btn'));
    expect(getByText('Please enter your name.')).toBeTruthy();

    // Enter name only
    fireEvent.changeText(getByTestId('contact-name-input'), 'Rishab Sharma');
    fireEvent.press(getByTestId('contact-submit-btn'));
    expect(getByText('Please enter a valid email address.')).toBeTruthy();

    // Enter valid email but no reason
    fireEvent.changeText(getByTestId('contact-email-input'), 'rishab@example.com');
    fireEvent.press(getByTestId('contact-submit-btn'));
    expect(getByText('Please select a reason for contacting us.')).toBeTruthy();
  });

  it('allows selecting a reason from the 3D animated dropdown and successfully submits form', async () => {
    const { getByTestId, getByText } = render(
      <ContactUsScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('contact-name-input'), 'Rishab Sharma');
    fireEvent.changeText(getByTestId('contact-email-input'), 'rishab@example.com');

    // Open 3D animated reason dropdown
    fireEvent.press(getByTestId('contact-reason-picker'));
    expect(getByText('Add a place')).toBeTruthy();
    expect(getByText('Collaboration')).toBeTruthy();
    expect(getByText('Advertising')).toBeTruthy();

    // Select 'Collaboration' matching user screenshot active item
    fireEvent.press(getByText('Collaboration'));

    // Verify selected reason is shown in the picker
    expect(getByText('Collaboration')).toBeTruthy();

    // Enter message
    fireEvent.changeText(getByTestId('contact-message-input'), 'I would like to suggest a collaboration for pet-friendly stays.');

    // Submit
    fireEvent.press(getByTestId('contact-submit-btn'));

    await waitFor(() => {
      expect(getByText('Message Received! 📨')).toBeTruthy();
    }, { timeout: 1500 });
  });
});
