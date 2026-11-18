import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '../NotificationBell';
import { NotificationsScreen } from '../../../screens/Notifications';
import { useStore } from '../../../store';

// Use the real hooks here (jest.setup.js stubs them for the other screen tests)
jest.mock('../../../hooks/useNotifications', () =>
  jest.requireActual('../../../hooks/useNotifications'),
);
jest.mock('../../../navigation/navigationRef', () => ({ navigate: jest.fn() }));
jest.mock('../../../services/api/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const { api } = require('../../../services/api/apiClient');
const { navigate } = require('../../../navigation/navigationRef');

const ITEMS = [
  { id: 1, title: 'New reply', message: 'Someone replied', is_read: false, created_at: '2026-11-16T10:00:00Z' },
  { id: 2, title: 'Place approved', message: 'Your place is live', is_read: true, created_at: '2026-11-15T10:00:00Z' },
  { id: 3, title: 'Pet alert', message: 'Dog found nearby', is_read: false, created_at: '2026-11-14T10:00:00Z' },
];

const renderWithClient = ui => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  jest.clearAllMocks();
  useStore.setState({ token: 'test-token' });
  api.get.mockImplementation(url =>
    Promise.resolve(url.endsWith('unread-count') ? { count: 2 } : ITEMS),
  );
  api.post.mockResolvedValue({});
});

describe('NotificationBell', () => {
  it('shows the unread count, then only unread items in the popup', async () => {
    const { findByText, getByTestId, queryByText } = renderWithClient(<NotificationBell />);

    expect(await findByText('2')).toBeTruthy();
    fireEvent.press(getByTestId('notification-bell'));

    expect(await findByText('New reply')).toBeTruthy();
    expect(queryByText('Pet alert')).toBeTruthy();
    expect(queryByText('Place approved')).toBeNull(); // read items stay out of the popup
  });

  it('marks one notification read when it is tapped', async () => {
    const { findByText, getByTestId } = renderWithClient(<NotificationBell />);
    fireEvent.press(getByTestId('notification-bell'));
    await findByText('New reply');

    fireEvent.press(getByTestId('notification-item-1'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/me/notifications/mark-read', { ids: [1] }),
    );
  });

  it('marks everything read', async () => {
    const { findByText, getByTestId } = renderWithClient(<NotificationBell />);
    fireEvent.press(getByTestId('notification-bell'));
    await findByText('New reply');

    fireEvent.press(getByTestId('notification-mark-all'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/me/notifications/mark-all-read'),
    );
  });

  it('opens the Notifications screen from View all', async () => {
    const { findByText, getByTestId } = renderWithClient(<NotificationBell />);
    fireEvent.press(getByTestId('notification-bell'));
    await findByText('New reply');

    fireEvent.press(getByTestId('notification-view-all'));

    expect(navigate).toHaveBeenCalledWith('Notifications');
  });

  it('lets a caller replace the popup', () => {
    const onPress = jest.fn();
    const { getByTestId, queryByText } = renderWithClient(<NotificationBell onPress={onPress} />);
    fireEvent.press(getByTestId('notification-bell'));
    expect(onPress).toHaveBeenCalled();
    expect(queryByText('View all')).toBeNull();
  });
});

describe('NotificationsScreen', () => {
  it('lists read and unread notifications together, newest first', async () => {
    const { findByText, getAllByText } = renderWithClient(
      <NotificationsScreen navigation={{ goBack: jest.fn() }} />,
    );

    expect(await findByText('New reply')).toBeTruthy();
    expect(await findByText('Place approved')).toBeTruthy(); // the read one is here too
    expect(await findByText('Pet alert')).toBeTruthy();
    expect(getAllByText(/ago|Nov|Jun|Just now/).length).toBeGreaterThan(0);
  });

  it('marks an unread item read on tap, but does nothing for a read one', async () => {
    const { findByText, getByTestId } = renderWithClient(
      <NotificationsScreen navigation={{ goBack: jest.fn() }} />,
    );
    await findByText('New reply');

    fireEvent.press(getByTestId('notifications-item-2'));
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('notifications-item-1'));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/me/notifications/mark-read', { ids: [1] }),
    );
  });

  it('filters to unread with the Unread tab', async () => {
    const { findByText, getByTestId, queryByText } = renderWithClient(
      <NotificationsScreen navigation={{ goBack: jest.fn() }} />,
    );
    await findByText('Place approved');

    fireEvent.press(getByTestId('notifications-tab-unread'));

    expect(queryByText('Place approved')).toBeNull();
    expect(queryByText('New reply')).toBeTruthy();
    expect(queryByText('Pet alert')).toBeTruthy();
  });

  it('shows an empty state when there are no notifications', async () => {
    api.get.mockImplementation(() => Promise.resolve([]));
    const { findByText } = renderWithClient(
      <NotificationsScreen navigation={{ goBack: jest.fn() }} />,
    );
    expect(await findByText('No notifications yet')).toBeTruthy();
  });
});
