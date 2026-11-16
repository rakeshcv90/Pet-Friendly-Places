import React from 'react';
import { render as rtlRender, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../../services/api/apiClient';
import { PetAlertsScreen } from '../PetAlertsScreen';

// The shared screen header reads the user profile through react-query
const render = ui =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const route = { params: { initialCity: 'Delhi' } };

describe('PetAlertsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the alert form with the city filled in', () => {
    const { getByText, getByDisplayValue } = render(
      <PetAlertsScreen navigation={navigation} route={route} />,
    );
    expect(getByText('Pet alerts')).toBeTruthy();
    expect(getByText('Set up an alert')).toBeTruthy();
    expect(getByDisplayValue('Delhi')).toBeTruthy();
    expect(getByText('0/3 Active')).toBeTruthy();
  });

  it('asks for consent before creating an alert', () => {
    const { getByText, getByPlaceholderText } = render(
      <PetAlertsScreen navigation={navigation} route={route} />,
    );
    fireEvent.changeText(getByPlaceholderText(/Indiranagar/), 'Uttam nagar');
    fireEvent.changeText(getByPlaceholderText(/Maharashtra/), 'Delhi');
    fireEvent.press(getByText('Create alert'));
    expect(getByText('Consent Required')).toBeTruthy();
  });

  it('asks for the locality, city and state', () => {
    const { getByText } = render(<PetAlertsScreen navigation={navigation} route={route} />);
    fireEvent.press(getByText('Create alert'));
    expect(getByText('Location Required')).toBeTruthy();
  });

  const fillForm = utils => {
    fireEvent.changeText(utils.getByPlaceholderText(/Indiranagar/), 'Uttam nagar');
    fireEvent.changeText(utils.getByPlaceholderText(/Maharashtra/), 'Delhi');
    fireEvent.press(utils.getByText(/Send me Reunite alerts/));
  };

  it('sends the alert to the API with the selected options', async () => {
    const spy = jest.spyOn(api, 'post').mockResolvedValue({ id: 'alert-1' });
    const utils = render(<PetAlertsScreen navigation={navigation} route={route} />);
    fillForm(utils);
    fireEvent.press(utils.getByText('Create alert'));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith('/reunite/alerts', {
      case_types: ['LOST', 'FOUND'],
      species: ['dog', 'cat'],
      locality: 'Uttam nagar',
      city: 'Delhi',
      state: 'Delhi',
      radius_km: 10,
      channel_email: true,
      channel_push: false,
      consent: true,
    });
    await waitFor(() => expect(utils.getByText('1/3 Active')).toBeTruthy());
    spy.mockRestore();
  });

  it('shows the server message and keeps the form when the alert is rejected', async () => {
    const error = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 403, data: { error: 'Verify your email first.' } },
    });
    const spy = jest.spyOn(api, 'post').mockRejectedValue(error);
    const utils = render(<PetAlertsScreen navigation={navigation} route={route} />);
    fillForm(utils);
    fireEvent.press(utils.getByText('Create alert'));

    await waitFor(() => expect(utils.getByText('Could not create alert')).toBeTruthy());
    expect(utils.getByText('Verify your email first.')).toBeTruthy();
    expect(utils.getByText('0/3 Active')).toBeTruthy();
    spy.mockRestore();
  });
});
