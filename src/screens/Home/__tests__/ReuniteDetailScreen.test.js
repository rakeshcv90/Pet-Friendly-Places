import React from 'react';
import { render as rtlRender, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../../services/api/apiClient';
import { ReuniteDetailScreen } from '../ReuniteDetailScreen';

const render = ui =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const post = {
  id: 'RU-000016',
  caseCode: 'RU-000016',
  slug: 'lost-dog-delhi-ru-000016',
  type: 'lost',
  species: 'dog',
  name: 'Tommy',
  breed: 'Indian',
  colour: 'Black',
  sex: 'Male',
  collar: 'Yes',
  microchip: 'Unknown',
  story: 'My pet is lost',
  contactName: 'Rakesh',
  location: 'Uttam nagar, Delhi, Delhi',
  eventDate: '2026-10-22',
  images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
};

describe('ReuniteDetailScreen', () => {
  it('shows the pet details, story and contact', () => {
    const { getByText, getAllByText, queryByText } = render(
      <ReuniteDetailScreen navigation={{ goBack: jest.fn() }} route={{ params: { post } }} />,
    );
    expect(getByText('Lost Dog')).toBeTruthy();
    expect(getByText(/Tommy/)).toBeTruthy();
    expect(getByText('Case RU-000016')).toBeTruthy();
    expect(getAllByText('Missing since').length).toBeGreaterThan(0);
    expect(getAllByText('22 Oct').length).toBeGreaterThan(0);
    expect(getAllByText('Indian').length).toBeGreaterThan(0);
    expect(getByText('My pet is lost')).toBeTruthy();
    expect(queryByText('Microchip')).toBeNull();
  });

  it('asks the server for the number when Show number is tapped, then offers Call', async () => {
    const spy = jest.spyOn(api, 'post').mockResolvedValue({ phone: '+91 98765 43210' });
    const { getAllByText, getByText, queryByText } = render(
      <ReuniteDetailScreen navigation={{ goBack: jest.fn() }} route={{ params: { post } }} />,
    );
    expect(queryByText('+91 98765 43210')).toBeNull();

    fireEvent.press(getAllByText('Show number')[0]);

    await waitFor(() => expect(getByText('+91 98765 43210')).toBeTruthy());
    expect(spy).toHaveBeenCalledWith('/reunite/cases/RU-000016/reveal-phone');
    expect(getByText('WhatsApp')).toBeTruthy();
    spy.mockRestore();
  });

  it('shows the error when the number cannot be loaded', async () => {
    const spy = jest.spyOn(api, 'post').mockRejectedValue(new Error('Please sign in first.'));
    const { getAllByText, getByText } = render(
      <ReuniteDetailScreen navigation={{ goBack: jest.fn() }} route={{ params: { post } }} />,
    );
    fireEvent.press(getAllByText('Show number')[0]);
    await waitFor(() => expect(getByText('Please sign in first.')).toBeTruthy());
    expect(getByText('Try again')).toBeTruthy();
    spy.mockRestore();
  });

  it('finds the number even when the server nests it under another key', async () => {
    const spy = jest
      .spyOn(api, 'post')
      .mockResolvedValue({ ok: true, contact: { whatsapp_number: '9876543210', name: 'Rakesh' } });
    const { getAllByText, getByText } = render(
      <ReuniteDetailScreen navigation={{ goBack: jest.fn() }} route={{ params: { post } }} />,
    );
    fireEvent.press(getAllByText('Show number')[0]);
    await waitFor(() => expect(getByText('9876543210')).toBeTruthy());
    spy.mockRestore();
  });
});
