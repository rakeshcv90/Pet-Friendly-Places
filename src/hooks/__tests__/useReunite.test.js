import { normalizeCase, toApiDate } from '../useReunite';

const withDetailsInDescription = {
  case_code: 'RU-000016',
  case_type: 'LOST',
  species: 'dog',
  pet_name: null,
  breed: null,
  sex: 'unknown',
  size: null,
  had_collar: null,
  microchipped: 'unknown',
  description:
    'My pet is lost\n\nName: Tommy. Breed: Indian. Colour: Black. Sex: Male. Age: 5. Size: Large. Wearing a collar. Microchip: No. Sterilised: No. Vaccinated: Yes.',
  event_date: '2026-10-22',
  locality: 'Uttam nagar',
  city: 'Delhi',
  state: 'Delhi',
  contact_name: 'Rakesh',
  created_at: '2026-11-05 14:50:53.347916+00',
  photos: [{ url: '/api/storage/objects/uploads/abc' }, { url: '/api/storage/objects/uploads/def' }],
};

describe('normalizeCase', () => {
  it('reads the pet details out of the description when the fields are empty', () => {
    const post = normalizeCase(withDetailsInDescription);
    expect(post).toMatchObject({
      id: 'RU-000016',
      type: 'lost',
      name: 'Tommy',
      breed: 'Indian',
      colour: 'Black',
      sex: 'Male',
      age: '5',
      size: 'Large',
      collar: 'Yes',
      microchip: 'No',
      sterilised: 'No',
      vaccinated: 'Yes',
      story: 'My pet is lost',
      location: 'Uttam nagar, Delhi',
      contactName: 'Rakesh',
      eventDate: '2026-10-22',
    });
  });

  it('reads the server timestamp format so the posted time shows', () => {
    const post = normalizeCase(withDetailsInDescription);
    expect(post.timeAgo).toMatch(/ago$/);
  });

  it('turns every photo into a full url', () => {
    const post = normalizeCase(withDetailsInDescription);
    expect(post.images).toHaveLength(2);
    expect(post.images[0]).toMatch(/^https:\/\/.+\/api\/storage\/objects\/uploads\/abc$/);
    expect(post.image).toBe(post.images[0]);
  });

  it('prefers real fields and hides unknown values', () => {
    const post = normalizeCase({
      case_code: 'RU-000015',
      case_type: 'LOST',
      species: 'dog',
      sex: 'male',
      size: 'medium',
      had_collar: false,
      microchipped: 'no',
      vaccinated: 'unknown',
      description: 'xcvxcvcxvcxv',
      photos: [],
    });
    expect(post).toMatchObject({
      name: '',
      sex: 'Male',
      size: 'Medium',
      collar: 'No',
      microchip: 'No',
      vaccinated: '',
      story: 'xcvxcvcxvcxv',
      image: undefined,
    });
  });
});

describe('toApiDate', () => {
  it('converts DD/MM/YYYY and rejects impossible dates', () => {
    expect(toApiDate('05/11/2026')).toBe('2026-11-05');
    expect(toApiDate('31/02/2026')).toBeNull();
    expect(toApiDate('2026-11-05')).toBeNull();
  });
});
