import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { PetProfileScreen } from '../PetProfileScreen';
import { useStore } from '../../../store';

const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpload = jest.fn();
const mockInvalidate = jest.fn();
let mockPets = [];
let mockPawsport = null;
let mockCities = [];
let mockRecords = [];

jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: (...args) => mockInvalidate(...args) }),
}));
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Rishab' } } }),
  useMyPets: () => ({ data: mockPets }),
  useDeletePet: () => ({ mutateAsync: (...args) => mockDelete(...args), isPending: false }),
  useUpdatePet: () => ({ mutateAsync: (...args) => mockUpdate(...args), isPending: false }),
  usePawsport: () => ({ data: mockPawsport }),
  uploadPetPhoto: (...args) => mockUpload(...args),
}));
jest.mock('../../../hooks/useDiscovery', () => ({
  resolveImageUrl: url => (url ? `https://cdn.test${url}` : ''),
  useDiscoveryCities: () => ({ data: mockCities }),
}));
jest.mock('../../../hooks/usePetHealth', () => ({
  ...jest.requireActual('../../../hooks/usePetHealth'),
  useHealthRecords: () => ({ data: mockRecords }),
}));
jest.mock('../../../components/notifications/NotificationBell', () => ({
  NotificationBell: () => null,
}));
jest.mock('../../../components/common/CityPickerModal', () => ({ CityPickerModal: () => null }));

const PET = {
  id: 'pet-1',
  slug: 'bruni',
  petName: 'Bruni',
  species: 'Dog',
  breed: 'Golden retriever',
  bio: 'For testing',
  profilePhotoUrl: '/img/bruni.jpg',
};
const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const style = node => StyleSheet.flatten(node.props.style);

const setup = (params = {}) =>
  render(<PetProfileScreen navigation={navigation} route={{ params: { pet: PET, ...params } }} />);

describe('PetProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStore.setState({ isDarkMode: false });
    mockPets = [PET];
    mockPawsport = null;
    mockCities = [];
    mockRecords = [];
    mockUpdate.mockResolvedValue({});
    mockDelete.mockResolvedValue({});
    mockUpload.mockResolvedValue(true);
  });

  describe('the page', () => {
    it('shows the "Pet profiles" header, the line under it and the Add a pet button', () => {
      const { getByText, getByTestId } = setup();

      expect(getByText('Pet profiles')).toBeTruthy();
      expect(
        getByText('Manage each pet’s profile, Pawsport, photos, and health records.'),
      ).toBeTruthy();
      expect(getByTestId('pet-profile-add')).toBeTruthy();
      expect(getByText('Add a pet')).toBeTruthy();
    });

    it('shows the pet being edited: photo, "EDITING", name, species and breed', () => {
      const { getByText, getByTestId } = setup();

      expect(getByTestId('pet-editing-card')).toBeTruthy();
      expect(getByText('EDITING')).toBeTruthy();
      expect(getByText('Bruni')).toBeTruthy();
      expect(getByText('Dog · Golden retriever')).toBeTruthy();
    });

    it('goes back from the header', () => {
      const { getByTestId } = setup();
      fireEvent.press(getByTestId('pet-profile-back'));
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('opens the add-pet form on the Profile tab from "Add a pet"', () => {
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('pet-profile-add'));
      expect(navigation.navigate).toHaveBeenCalledWith('MainTabs', {
        screen: 'Profile',
        params: { openAddPet: true },
      });
    });

    it('opens the pet\'s Pawsport from "View Profile"', () => {
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('pet-view-profile'));
      expect(navigation.navigate).toHaveBeenCalledWith('PawsportScreen', { pet: PET });
    });

    it('uses the newest copy of the pet after it is saved', () => {
      mockPets = [{ ...PET, petName: 'Bruni Jr' }];
      const { getByText } = setup();
      expect(getByText('Bruni Jr')).toBeTruthy();
    });
  });

  describe('removing the pet', () => {
    it('asks first, and does nothing if cancelled', () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('pet-remove'));
      expect(alert).toHaveBeenCalledTimes(1);
      expect(alert.mock.calls[0][0]).toBe('Remove Bruni?');
      expect(mockDelete).not.toHaveBeenCalled();
      alert.mockRestore();
    });

    it('removes the pet and goes back when confirmed', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('pet-remove'));
      const remove = alert.mock.calls[0][2].find(button => button.text === 'Remove');
      await act(async () => {
        await remove.onPress();
      });

      expect(mockDelete).toHaveBeenCalledWith('pet-1');
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      alert.mockRestore();
    });

    it('tells the user when it could not be removed, and stays on the page', async () => {
      mockDelete.mockRejectedValueOnce(new Error('network'));
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('pet-remove'));
      const remove = alert.mock.calls[0][2].find(button => button.text === 'Remove');
      await act(async () => {
        await remove.onPress();
      });

      expect(alert.mock.calls[1][0]).toBe('Could not remove pet');
      expect(navigation.goBack).not.toHaveBeenCalled();
      alert.mockRestore();
    });
  });

  describe('tabs', () => {
    it('has the five tabs, and starts on Basic Info', () => {
      const { getByTestId } = setup();

      ['basic', 'photo', 'social', 'stamps', 'health'].forEach(id =>
        expect(getByTestId(`pet-tab-${id}`)).toBeTruthy(),
      );
      expect(getByTestId('pet-tab-basic').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('pet-panel-basic')).toBeTruthy();
    });

    it('switches panel when a tab is chosen, showing only that panel', () => {
      const { getByTestId, queryByTestId } = setup();

      fireEvent.press(getByTestId('pet-tab-photo'));
      expect(getByTestId('pet-panel-photo')).toBeTruthy();
      expect(queryByTestId('pet-panel-basic')).toBeNull();
      expect(getByTestId('pet-tab-photo').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('pet-tab-basic').props.accessibilityState.selected).toBe(false);

      ['social', 'stamps', 'health'].forEach(id => {
        fireEvent.press(getByTestId(`pet-tab-${id}`));
        expect(getByTestId(`pet-panel-${id}`)).toBeTruthy();
      });
    });

    it('opens on the tab it is asked to', () => {
      const { getByTestId } = setup({ tab: 'health' });
      expect(getByTestId('pet-panel-health')).toBeTruthy();
    });

    it('ignores a tab name it does not know', () => {
      const { getByTestId } = setup({ tab: 'nope' });
      expect(getByTestId('pet-panel-basic')).toBeTruthy();
    });

    it('marks them as tabs for screen readers', () => {
      const { getByTestId } = setup();
      expect(getByTestId('pet-tab-stamps').props.accessibilityRole).toBe('tab');
    });
  });

  describe('Basic Info', () => {
    it('shows what the pet already has', () => {
      const { getByTestId } = setup();

      expect(getByTestId('pet-name').props.value).toBe('Bruni');
      expect(getByTestId('pet-breed').props.value).toBe('Golden retriever');
      expect(getByTestId('pet-bio').props.value).toBe('For testing');
      expect(getByTestId('pet-species-Dog').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('pet-gender-Not specified').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('pet-bio-count').props.children).toBe('11/400');
    });

    it('saves exactly what was typed and chosen', async () => {
      const { getByTestId } = setup();

      fireEvent.changeText(getByTestId('pet-name'), '  Bruno ');
      fireEvent.press(getByTestId('pet-species-Cat'));
      fireEvent.press(getByTestId('pet-gender-Female'));
      fireEvent.changeText(getByTestId('pet-age'), '4');
      fireEvent.changeText(getByTestId('pet-bio'), 'Loves the beach');
      await act(async () => {
        fireEvent.press(getByTestId('pet-save-basic'));
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'pet-1',
        petName: 'Bruno',
        species: 'Cat',
        breed: 'Golden retriever',
        bio: 'Loves the beach',
        gender: 'female',
        age: 4,
      });
    });

    it('leaves out the gender and age when they are not given', async () => {
      const { getByTestId } = setup();
      await act(async () => {
        fireEvent.press(getByTestId('pet-save-basic'));
      });

      const sent = mockUpdate.mock.calls[0][0];
      expect(sent).not.toHaveProperty('gender');
      expect(sent).not.toHaveProperty('age');
    });

    it('does not save without a name, and says so', async () => {
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = setup();

      fireEvent.changeText(getByTestId('pet-name'), '   ');
      await act(async () => {
        fireEvent.press(getByTestId('pet-save-basic'));
      });

      expect(alert).toHaveBeenCalledWith('Name required', 'Please enter your pet’s name.');
      expect(mockUpdate).not.toHaveBeenCalled();
      alert.mockRestore();
    });

    it('tells the user when saving fails', async () => {
      mockUpdate.mockRejectedValueOnce({ response: { data: { error: 'Name taken' } } });
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = setup();

      await act(async () => {
        fireEvent.press(getByTestId('pet-save-basic'));
      });

      expect(alert).toHaveBeenCalledWith('Could not save changes', 'Name taken');
      alert.mockRestore();
    });

    it('counts the bio as it is typed', () => {
      const { getByTestId } = setup();
      fireEvent.changeText(getByTestId('pet-bio'), 'Hello');
      expect(getByTestId('pet-bio-count').props.children).toBe('5/400');
    });
  });

  describe('Photo', () => {
    const toPhoto = () => {
      const view = setup();
      fireEvent.press(view.getByTestId('pet-tab-photo'));
      return view;
    };

    it("shows the profile photo and the website's wording", () => {
      const { getByText, getByTestId, queryByTestId } = toPhoto();

      expect(getByText('Profile Photo')).toBeTruthy();
      expect(getByText('Reviewed by AI — goes live instantly if it passes.')).toBeTruthy();
      expect(getByText('JPG, PNG, WebP or HEIC · max 10 MB')).toBeTruthy();
      expect(getByTestId('pet-photo-image').props.source).toEqual({
        uri: 'https://cdn.test/img/bruni.jpg',
      });
      expect(queryByTestId('pet-photo-empty')).toBeNull();
    });

    it('says "No photo yet" for a pet without one', () => {
      mockPets = [{ ...PET, profilePhotoUrl: undefined }];
      const view = render(
        <PetProfileScreen
          navigation={navigation}
          route={{ params: { pet: { ...PET, profilePhotoUrl: undefined }, tab: 'photo' } }}
        />,
      );

      expect(view.getByTestId('pet-photo-empty')).toBeTruthy();
      expect(view.getByText('No photo yet')).toBeTruthy();
    });

    it('uploads the chosen photo, shows it, and reloads the pet list', async () => {
      launchImageLibrary.mockImplementation((options, callback) =>
        callback({ assets: [{ uri: 'file:///new.jpg', fileName: 'new.jpg', type: 'image/jpeg' }] }),
      );
      const { getByTestId } = toPhoto();

      await act(async () => {
        fireEvent.press(getByTestId('pet-photo-change'));
      });

      expect(mockUpload).toHaveBeenCalledWith(
        'pet-1',
        expect.objectContaining({ uri: 'file:///new.jpg' }),
      );
      expect(getByTestId('pet-photo-image').props.source).toEqual({ uri: 'file:///new.jpg' });
      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['user', 'pets'] });
    });

    it('does nothing when the picker is closed without a choice', async () => {
      launchImageLibrary.mockImplementation((options, callback) => callback({ didCancel: true }));
      const { getByTestId } = toPhoto();

      await act(async () => {
        fireEvent.press(getByTestId('pet-photo-change'));
      });
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('tells the user when the upload fails, and keeps the old photo', async () => {
      mockUpload.mockResolvedValueOnce(false);
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      launchImageLibrary.mockImplementation((options, callback) =>
        callback({ assets: [{ uri: 'file:///new.jpg' }] }),
      );
      const { getByTestId } = toPhoto();

      await act(async () => {
        fireEvent.press(getByTestId('pet-photo-change'));
      });

      expect(alert.mock.calls[0][0]).toBe('Could not upload photo');
      expect(getByTestId('pet-photo-image').props.source).toEqual({
        uri: 'https://cdn.test/img/bruni.jpg',
      });
      alert.mockRestore();
    });
  });

  describe('Social', () => {
    const toSocial = pet => {
      const view = render(
        <PetProfileScreen
          navigation={navigation}
          route={{ params: { pet: pet || PET, tab: 'social' } }}
        />,
      );
      return view;
    };

    it("has Instagram, YouTube, X / Twitter and Website boxes with the website's hints", () => {
      const { getByText, getByTestId } = toSocial();

      expect(getByText('Social Links')).toBeTruthy();
      expect(
        getByText(
          "Add your pet's social profiles. These appear on their Pawsport and in the leaderboard.",
        ),
      ).toBeTruthy();
      expect(getByTestId('pet-social-instagram').props.placeholder).toBe('instagram_handle');
      expect(getByTestId('pet-social-youtube').props.placeholder).toBe('youtube.com/c/yourchannel');
      expect(getByTestId('pet-social-twitter').props.placeholder).toBe('x_handle');
      expect(getByTestId('pet-social-website').props.placeholder).toBe('yourdog.com');
    });

    it('fills in the links the pet already has', () => {
      mockPets = [{ ...PET, instagram: 'bruni', website: 'bruni.com' }];
      const { getByTestId } = toSocial({ ...PET, instagram: 'bruni', website: 'bruni.com' });

      expect(getByTestId('pet-social-instagram').props.value).toBe('bruni');
      expect(getByTestId('pet-social-website').props.value).toBe('bruni.com');
    });

    it('saves the links, without a leading @ on handles', async () => {
      const { getByTestId } = toSocial();

      fireEvent.changeText(getByTestId('pet-social-instagram'), '@bruni');
      fireEvent.changeText(getByTestId('pet-social-website'), ' bruni.com ');
      await act(async () => {
        fireEvent.press(getByTestId('pet-save-social'));
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'pet-1',
        instagram: 'bruni',
        youtube: '',
        twitter: '',
        website: 'bruni.com',
      });
    });

    it('does not send anything when nothing changed', async () => {
      const { getByTestId } = toSocial();

      await act(async () => {
        fireEvent.press(getByTestId('pet-save-social'));
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('tells the user when saving the links fails', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('offline'));
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = toSocial();

      fireEvent.changeText(getByTestId('pet-social-youtube'), 'youtube.com/c/b');
      await act(async () => {
        fireEvent.press(getByTestId('pet-save-social'));
      });

      expect(alert).toHaveBeenCalledWith('Could not save links', 'offline');
      alert.mockRestore();
    });
  });

  describe('Stamps', () => {
    const toStamps = () => {
      const view = setup({ tab: 'stamps' });
      return view;
    };

    it("shows the title and the website's explanation", () => {
      const { getByText } = toStamps();

      expect(getByText('Pawsport Stamps')).toBeTruthy();
      expect(
        getByText(
          'Stamps are earned automatically when your reviews are approved. Visit more places to unlock more.',
        ),
      ).toBeTruthy();
    });

    it('lists the cities left to unlock as locked tiles', () => {
      mockCities = [{ name: 'New Delhi' }, { name: 'Gogwan Jalalpur' }, { name: 'Yeak Bagdi' }];
      const { getByText, getByTestId } = toStamps();

      expect(getByText('Cities left to unlock')).toBeTruthy();
      expect(getByTestId('pet-locked-0')).toBeTruthy();
      expect(getByText('New Delhi')).toBeTruthy();
      expect(getByText('Yeak Bagdi')).toBeTruthy();
    });

    it('shows ten locked cities at most', () => {
      mockCities = Array.from({ length: 14 }, (_, i) => ({ name: `City ${i + 1}` }));
      const { queryByTestId } = toStamps();

      expect(queryByTestId('pet-locked-9')).toBeTruthy();
      expect(queryByTestId('pet-locked-10')).toBeNull();
    });

    it('shows the stamps the pet has earned, and does not lock those cities again', () => {
      mockPawsport = { stamps: [{ id: 1, placeName: 'Beach Cafe', city: 'Goa' }] };
      mockCities = [{ name: 'Goa' }, { name: 'Pune' }];
      const { getByText, getByTestId, queryByText } = toStamps();

      expect(getByText('Earned stamps')).toBeTruthy();
      expect(getByTestId('pet-stamp-0')).toBeTruthy();
      expect(getByText('Beach Cafe')).toBeTruthy();
      expect(getByText('Pune')).toBeTruthy();
      expect(queryByText('Goa')).toBeNull();
    });

    it('says so when there is nothing to show', () => {
      const { getByTestId } = toStamps();
      expect(getByTestId('pet-stamps-empty')).toBeTruthy();
    });
  });

  describe('Health Records', () => {
    const toHealth = () => setup({ tab: 'health' });

    it('shows the privacy note, the title and the two buttons', () => {
      const { getByText } = toHealth();

      expect(
        getByText(
          "Only you can see these. Health records are never shown on your pet's public profile.",
        ),
      ).toBeTruthy();
      expect(getByText('Health Records')).toBeTruthy();
      expect(getByText('Keep health and travel documents together for easy access.')).toBeTruthy();
      expect(getByText('Open health records book')).toBeTruthy();
      expect(getByText('Add record')).toBeTruthy();
    });

    it('lists the records the way the website does', () => {
      mockRecords = [
        {
          id: 1,
          documentType: 'vaccination',
          recordName: 'Rabies booster',
          dateIssued: '2026-03-05T00:00:00Z',
          files: [{}],
        },
        { id: 2, documentType: 'deworming' },
      ];
      const { getByText, getByTestId } = toHealth();

      expect(getByTestId('pet-record-0')).toBeTruthy();
      expect(getByText('Rabies booster')).toBeTruthy();
      expect(getByText('Issued 2026-03-05 · Due Not added · 1 file')).toBeTruthy();
      expect(getByText('Deworming')).toBeTruthy();
      expect(getByText('Issued Not added · Due Not added · 0 files')).toBeTruthy();
    });

    it('puts the records under a heading for their type', () => {
      mockRecords = [
        { id: 1, documentType: 'vaccination' },
        { id: 2, documentType: 'deworming' },
        { id: 3, documentType: 'vaccination' },
      ];
      const { getByText, getByTestId } = toHealth();

      expect(getByText('VACCINATION')).toBeTruthy();
      expect(getByText('DEWORMING')).toBeTruthy();
      expect(getByTestId('pet-record-group-vaccination')).toBeTruthy();
      expect(getByTestId('pet-record-group-deworming')).toBeTruthy();
      expect(getByTestId('pet-record-2')).toBeTruthy();
    });

    it('says so when there are no records', () => {
      const { getByTestId } = toHealth();
      expect(getByTestId('pet-health-empty')).toBeTruthy();
    });

    it('opens the health records book from its button', () => {
      const { getByTestId } = toHealth();

      fireEvent.press(getByTestId('pet-health-book'));
      expect(navigation.navigate).toHaveBeenCalledWith('PetHealthRecordsScreen', { pet: PET });
    });

    it('opens the add-record form straight away from "Add record"', () => {
      const { getByTestId } = toHealth();

      fireEvent.press(getByTestId('pet-health-add'));
      expect(navigation.navigate).toHaveBeenCalledWith('PetHealthRecordsScreen', {
        pet: PET,
        initialView: 'form',
      });
    });
  });

  describe('dark mode', () => {
    it('uses the dark app colours for the page and the cards', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = setup();

      expect(style(getByTestId('pet-editing-card')).backgroundColor).toBe('#1A0B30');
      expect(style(getByTestId('pet-panel-basic')).backgroundColor).toBe('#1A0B30');
    });

    it('keeps the light cards in light mode', () => {
      const { getByTestId } = setup();

      expect(style(getByTestId('pet-editing-card')).backgroundColor).toBe('#FFFFFF');
      expect(style(getByTestId('pet-panel-basic')).backgroundColor).toBe('#FFFFFF');
    });
  });
});
