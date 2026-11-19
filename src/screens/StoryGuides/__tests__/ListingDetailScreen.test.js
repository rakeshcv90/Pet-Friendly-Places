import React from 'react';
import { Linking, Share } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ListingDetailScreen } from '../ListingDetailScreen';
import {
  parseList,
  buildListing,
  splitSentences,
  formatLongDate,
  formatMonthYear,
} from '../ListingDetail/listingModel';
import { contactActions } from '../ListingDetail/ContactBar';
import { useListingDetail } from '../../../hooks/useDiscovery';

// Saving goes to the account API; here the heart just flips so the screen can be checked
jest.mock('../../../hooks/useUser', () => {
  const React = require('react');
  return {
    useSavePlace: () => {
      const [saved, setSaved] = React.useState(false);
      return {
        saved,
        toggle: () => {
          setSaved(value => !value);
          return true;
        },
      };
    },
  };
});

jest.mock('../../../hooks/useDiscovery', () => ({
  useListingDetail: jest.fn(),
  resolveImageUrl: url => (url ? `https://site.test${url}` : ''),
}));
jest.mock('../../../services/storage/storage', () => {
  const actual = jest.requireActual('../../../services/storage/storage');
  const store = {};
  return {
    ...actual,
    getItem: (key, isObject) => (isObject && store[key] ? JSON.parse(store[key]) : store[key] || null),
    setItem: (key, value) => {
      store[key] = typeof value === 'object' ? JSON.stringify(value) : value;
    },
  };
});

// trimmed from GET /listings/rosehill-cottage-near-gurgaon (the website's reference page)
const RAW = {
  id: 555,
  slug: 'rosehill-cottage-near-gurgaon',
  name: 'Rosehill Cottage - Pet-Friendly Pool Villa (Gurgaon)',
  excerpt: 'Rosehill Cottage in Gurugram is a 2-bedroom villa with a fully fenced private property.',
  specific_type: 'Villa',
  category: 'Stays',
  city: 'New Delhi',
  state: 'Delhi',
  pet_friendliness_level: 'pet_friendly',
  verification_status: 'verified',
  verification_tier: 'TEAM_VERIFIED',
  verification_method: 'primary_source_website',
  verification_tier_set_at: '2026-06-03T21:29:38.431Z',
  reviewed_at: '2026-06-03T21:29:11.000Z',
  verification_notes: 'Verified via Hushstays platform listing page.',
  view_count: 35351,
  review_count: 0,
  phone: '+91 8826915266',
  website: 'https://www.hushstays.com/rosehill-pool-cottage-gurgaon',
  description: '<p><strong>Leash policy:</strong> Leashes are required in common areas.</p>',
  pet_charges: null,
  pet_charges_notes: 'No extra charge for pets. Pool heating charge ₹4,000 extra November to March.',
  pet_charges_type: 'free',
  pet_policy:
    'Pets are not allowed in the pool. Bring your own pet bedding. Must be well-mannered. No boarding charge. Prior notice not mandatory.',
  off_leash_use_permitted: false,
  leash_policy: 'Leash required in common areas',
  allowed_pet_types: '["Dogs","Cats"]',
  allowed_dog_sizes: '["All sizes"]',
  pet_friendly_areas: '["Private fenced garden , entire property","Outdoor lawn"]',
  pet_amenities: '["Pet-friendly outdoor area"]',
  public_or_private_access: 'private',
  parking_available: true,
  water_access_available: true,
  open_lawn_available: true,
  pets_in_room: true,
  best_for_large_dogs: true,
  best_for_road_trips: true,
  best_for_overnight_stay: true,
  tags: '["rosehill cottage gurgaon","fenced villa gurgaon dogs"]',
  pros: '["Fenced private land"]',
  cons: '["Bring your own bedding"]',
  main_image_url: '/api/storage/objects/uploads/main',
  images: [
    { image_url: '/api/storage/objects/uploads/two', media_type: 'image', is_main: false },
    { image_url: '/api/storage/objects/uploads/main', media_type: 'image', is_main: true },
    { image_url: '/api/storage/objects/uploads/three', media_type: 'image', is_main: false },
  ],
};

const nav = { goBack: jest.fn(), push: jest.fn(), navigate: jest.fn() };
const mockHook = value =>
  useListingDetail.mockReturnValue({ data: value, isLoading: false, refetch: jest.fn(), isRefetching: false });
const renderScreen = () =>
  render(<ListingDetailScreen navigation={nav} route={{ params: { slug: RAW.slug } }} />);

describe('listing model', () => {
  it('parses JSON-text, array and comma lists', () => {
    expect(parseList('["Dogs","Cats"]')).toEqual(['Dogs', 'Cats']);
    expect(parseList(['a', '', 'b'])).toEqual(['a', 'b']);
    expect(parseList('x, y')).toEqual(['x', 'y']);
    expect(parseList(null)).toEqual([]);
  });

  it('splits sentences and formats dates like the website', () => {
    expect(splitSentences('One thing. Another thing! Last one')).toEqual([
      'One thing.',
      'Another thing!',
      'Last one',
    ]);
    expect(formatLongDate('2026-06-03T21:29:11Z')).toBe('3 June 2026');
    expect(formatMonthYear('2026-06-03T21:29:11Z')).toBe('June 2026');
    expect(formatLongDate(null)).toBe('');
  });

  it('builds the view model in the website sections', () => {
    const l = buildListing(RAW);
    expect(l.verifiedLabel).toBe('Team Verified');
    expect(l.levelLabel).toBe('Pet Friendly');
    expect(l.categoryLabel).toBe('Stay');
    expect(l.location).toBe('New Delhi, Delhi');
    expect(l.viewsLabel).toBe('35,351 views');
    expect(l.photos).toHaveLength(3);
    expect(l.photos[0]).toBe('https://site.test/api/storage/objects/uploads/main'); // main photo first
    expect(l.petsWelcomed).toEqual([
      { label: 'Dogs', emoji: '🐶' },
      { label: 'Cats', emoji: '🐱' },
    ]);
    expect(l.attributes).toEqual([
      'Water Access',
      'Parking Available',
      'Open Lawn',
      'Large Dogs Welcome',
      'Road Trip Friendly',
      'Overnight Stay',
    ]);
    // charges fall back to the notes when pet_charges is empty
    expect(l.quickFacts.find(f => f.label === 'Pet Charges').value).toContain('No extra charge for pets.');
    expect(l.quickFacts.find(f => f.label === 'Room Type').value).toBe('Villa');
    expect(l.quickFacts.find(f => f.label === 'Pets in Room').value).toBe('Yes');
    expect(l.policy.keyRules).toHaveLength(5);
    expect(l.policy.offLeash).toBe('No');
    expect(l.policy.allowedIn).toEqual(['Private fenced garden, entire property', 'Outdoor lawn']);
    expect(l.policy.access).toBe('Private');
    expect(l.policy.feeBasis).toBe('Free');
    expect(l.policy.reviewMethod).toBe('primary source website');
    expect(l.policy.reviewDate).toBe('3 June 2026');
    expect(l.trust.monthYear).toBe('June 2026');
    expect(l.trust.text).toBe(
      'Pet policy confirmed by the Pet Friendly Places team via primary source website.',
    );
    expect(l.nearby).toEqual([]);
    expect(buildListing(null)).toBeNull();
  });

  it('builds contact actions from what the listing has', () => {
    const keys = contactActions(buildListing(RAW).contact).map(a => a.key);
    expect(keys).toEqual(['call', 'website', 'directions']);
    expect(contactActions({})).toEqual([]);
  });
});

describe('ListingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, 'openURL').mockResolvedValue();
    jest.spyOn(Share, 'share').mockResolvedValue({});
  });

  it('loads GET /listings/:slug for the slug it was opened with', () => {
    mockHook(RAW);
    const { getByText } = renderScreen();

    expect(useListingDetail).toHaveBeenCalledWith('rosehill-cottage-near-gurgaon');
    expect(getByText(RAW.name)).toBeTruthy();
  });

  it('shows the website sections in order with their data', () => {
    mockHook(RAW);
    const { getByText, getAllByText } = renderScreen();

    expect(getByText('Stay · Villa')).toBeTruthy();
    expect(getAllByText('Team Verified').length).toBeGreaterThan(0);
    expect(getAllByText('Pet Friendly').length).toBeGreaterThan(0);
    expect(getByText('35,351 views')).toBeTruthy();
    expect(getByText('Pets welcomed')).toBeTruthy();
    expect(getAllByText('Dogs').length).toBeGreaterThan(0); // pets welcomed + allowed pets
    expect(getByText('Water Access')).toBeTruthy();
    expect(getByText('Quick facts')).toBeTruthy();
    expect(getByText('Pet Charges')).toBeTruthy();
    expect(getByText('Why pet parents will love this place')).toBeTruthy();
    expect(getByText('Pet policy')).toBeTruthy();
    expect(getByText('KEY RULES')).toBeTruthy();
    expect(getByText('Pets are not allowed in the pool.')).toBeTruthy();
    expect(getByText('Verified June 2026')).toBeTruthy();
  });

  it('does not show reviews, nearby places or the help and support rows', () => {
    mockHook(RAW);
    const { queryByText, queryByTestId } = renderScreen();

    expect(queryByText('Pet parent reviews')).toBeNull();
    expect(queryByText('No trail notes yet')).toBeNull();
    expect(queryByText(/Pet-friendly places in/)).toBeNull();
    expect(queryByText('Help and support')).toBeNull();
    expect(queryByTestId('listing-support-community')).toBeNull();
    expect(queryByTestId('listing-write-review')).toBeNull();
  });

  it('shows nearby places from the API and opens one', () => {
    mockHook({
      ...RAW,
      nearby: [
        {
          slug: 'novotel-goa-candolim',
          name: 'Novotel Goa Candolim',
          category: 'Stays',
          city: 'Candolim',
          state: 'Goa',
          verification_tier: 'TEAM_VERIFIED',
          main_image_url: '/api/storage/objects/uploads/n1',
        },
      ],
    });
    const { getByText } = renderScreen();

    expect(getByText('Pet-friendly places in New Delhi')).toBeTruthy();
    expect(getByText('Novotel Goa Candolim')).toBeTruthy();
    expect(getByText('Candolim, Goa')).toBeTruthy();
    fireEvent.press(getByText('Novotel Goa Candolim'));
    expect(nav.push).toHaveBeenCalledWith('ListingDetailScreen', { slug: 'novotel-goa-candolim' });
  });

  it('expands the full pet policy, fee history and review details', () => {
    mockHook(RAW);
    const { getByTestId, getByText, queryByText } = renderScreen();

    expect(queryByText('REVIEW DETAILS')).toBeNull();
    fireEvent.press(getByTestId('listing-full-policy-toggle'));
    expect(getByText('REVIEW DETAILS')).toBeTruthy();
    expect(getByText('Review date: 3 June 2026')).toBeTruthy();
    expect(getByText('Recorded fee basis: Free')).toBeTruthy();
  });

  it('saves a listing and shares it', () => {
    mockHook(RAW);
    const { getByTestId, getByText } = renderScreen();

    expect(getByText('Save for later')).toBeTruthy();
    fireEvent.press(getByTestId('listing-save-button'));
    expect(getByText('Saved')).toBeTruthy();
    fireEvent.press(getByTestId('listing-save-button'));
    expect(getByText('Save for later')).toBeTruthy();

    fireEvent.press(getByTestId('listing-share-button'));
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('/places/rosehill-cottage-near-gurgaon') }),
    );
  });

  it('calls the listing and opens the full gallery', () => {
    mockHook(RAW);
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('listing-action-call'));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+918826915266');

    fireEvent.press(getByTestId('listing-open-gallery'));
    expect(getByTestId('photo-viewer-close')).toBeTruthy();
  });

  it('goes back from the floating back button', () => {
    mockHook(RAW);
    const { getByTestId } = renderScreen();
    fireEvent.press(getByTestId('guide-back-button'));
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('shows a retry state when the listing cannot be loaded', () => {
    mockHook(null);
    const { getByText, getByTestId } = renderScreen();
    expect(getByText('Listing not found')).toBeTruthy();
    expect(getByTestId('listing-retry-button')).toBeTruthy();
  });

  it('shows the loader while the first request is in flight', () => {
    useListingDetail.mockReturnValue({ data: null, isLoading: true, refetch: jest.fn(), isRefetching: false });
    const { getByText } = renderScreen();
    expect(getByText('Loading listing...')).toBeTruthy();
  });
});
