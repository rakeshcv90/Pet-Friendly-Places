jest.mock('../../../hooks/useDiscovery', () => ({
  resolveImageUrl: u => (u ? (u.startsWith('http') ? u : `https://x.test${u}`) : ''),
}));

import {
  slugifyCity,
  buildCategories,
  sortListings,
  listingToCard,
  normalizeIntro,
  categoryTaglines,
  readRoutes,
  readNearby,
} from '../cityDetailModel';

const L = [
  { id: 1, slug: 'a', name: 'A', category: 'Stays', verification_tier: 'TEAM_VERIFIED', verification_status: 'verified' },
  { id: 2, slug: 'b', name: 'B', category: 'Eat out' },
  { id: 3, slug: 'c', name: 'C', category: 'Stays', verification_tier: 'TAILS_VERIFIED', verification_status: 'verified', main_image_url: '/img/c' },
];

const AGONDA_INTRO = {
  "citySlug": "agonda",
  "status": "published",
  "h1": "Pet-Friendly Places in Agonda",
  "tagline": "Agonda village, St Anne parish and a coastline with turtle-nesting significance.",
  "heroDescription": "Plan an Agonda stay around its own village address and sensitive coastal setting. Distinguish Palolem and Cola outings and keep nesting areas outside your pet’s plans.",
  "cityIntroMarkdown": "Agonda is both a village and a beach destination in Canacona taluka, within the current Kushavati district of southern Goa. It is distinct from Palolem, Cola and the wider Canacona coast.\n\nThe Goa government identifies Agonda as an Olive Ridley nesting beach. Let that shape the trip from the outset: choose a suitable accommodation base and verify individual outings, without expecting every stretch of coast to serve as a pet exercise area.",
  "howToGetThereMarkdown": "Plan the final road transfer around the airport or station on your ticket and the actual entrance of your Agonda accommodation. Ask whether the driver reaches the entrance or you must walk with your bags.\n\nConfirm pet carriage with the transport operator beforehand. If your directions mention Canacona or Chaudi, make sure the booking still gives Agonda as the destination village. Confirm the return pickup point for each separate excursion.",
  "petSafetyMarkdown": "Keep pets away from nesting enclosures, marked conservation areas and wildlife. As a precaution, treat those spaces as no-entry unless the responsible authority explicitly directs otherwise; this guide does not claim a verified legal pet prohibition for the whole beach.\n\nAsk about current instructions at your intended access point. Do not plan turtle encounters with your pet. At the accommodation, establish an approved toileting area and a sheltered alternative before arrival, so a restricted beach section never leaves you dependent on an unsuitable outing.",
  "neighbourhoodsMarkdown": "Separate the village you book from the wider region:\n\n- **Agonda:** A distinct revenue village and beach destination in Canacona.\n- **Chaudi/Canacona:** A town-area reference used in the district’s visitor guide, alongside the broader taluka name.\n- **Cola:** A separate village and beach destination, described by the district for its lagoon.\n- **Nagorcem-Palolem:** A separate revenue-village name useful when checking a Palolem-area address.\n\nThese labels help with orientation; they do not establish walking connections, beach entry points or travel times.",
  "thingsToDoMarkdown": "Consider these destination highlights with separate access checks:\n\n- **Agonda’s coast:** Let the landscape be part of the stay while respecting any wildlife-related instructions. Choose an alternative activity if access is unsuitable.\n- **St Anne Church:** The Archdiocese identifies this parish at Agonda. Confirm visitor arrangements and organise separate pet care unless permission is explicit.\n- **Palolem or Cola:** The district describes Palolem’s crescent shoreline and Cola’s lagoon. Each is a different excursion with its own approach and permissions.\n\nChoose a manageable outing rather than repeated coastal transfers.",
  "bestTimeMarkdown": "Goa’s official overview describes a hot, humid climate, with the monsoon broadly in June–September and a short winter from mid-December to February.\n\nConsult [IMD Goa’s forecasts and warnings](https://mausam.imd.gov.in/goa/) before settling outdoor plans. Ask your host about sheltered space and the room approach during rain. Neither a seasonal description nor fair weather confirms nesting activity, wildlife viewing, safe water conditions or permission to bring a pet onto the shore.",
  "faqMarkdown": "## Is Agonda part of Palolem?\n\nNo. Agonda and Nagorcem-Palolem are separately listed villages within Canacona taluka. Confirm which one appears on the accommodation address.\n\n---\n\n## Can I take my pet to see nesting turtles?\n\nDo not plan that. Keep away from nesting areas and wildlife, follow the responsible authority’s instructions and choose a different permitted activity.\n\n---\n\n## Does an Agonda booking guarantee direct beach access?\n\nNo. Ask for the actual gate, approach and permitted access point. Accommodation approval does not establish permission on the beach."
};

describe('cityDetailModel', () => {
  it('slugifies city names', () => {
    expect(slugifyCity('New Delhi')).toBe('new-delhi');
    expect(slugifyCity(' Agonda ')).toBe('agonda');
  });

  it('builds category counts with All first', () => {
    const cats = buildCategories(L);
    expect(cats[0]).toMatchObject({ key: 'all', count: 3 });
    expect(cats[1]).toMatchObject({ key: 'Stays', count: 2, icon: 'bed-outline' });
  });

  it('sorts Tails Verified first and maps cards', () => {
    const sorted = sortListings(L);
    expect(sorted.map(l => l.id)).toEqual([3, 1, 2]);
    expect(listingToCard(L[2])).toMatchObject({
      slug: 'c',
      badge: 'Tails Verified',
      imageUri: 'https://x.test/img/c',
    });
    expect(listingToCard(L[1]).badge).toBe('');
  });

  it('normalizes intro sections from text, html and lists', () => {
    const intro = normalizeIntro({
      about: '<p>Quiet beach town.</p>',
      getting_there: ['By road', 'By train'],
      areasToKnow: [{ title: 'Palolem', description: 'Busy' }],
    });
    expect(intro.sections.map(s => s.key)).toEqual(['about', 'getting_there', 'areas_to_know']);
    expect(intro.sections[0].body).toEqual(['Quiet beach town.']);
    expect(intro.sections[2].body).toEqual(['Palolem: Busy']);
    expect(normalizeIntro(null).sections).toEqual([]);
  });

  it('reads the website-style intro fields (camelCase markdown) in website order', () => {
    const intro = normalizeIntro({
      citySlug: 'agra',
      h1: 'Pet-Friendly Places in Agra',
      tagline: 'White-marble heritage and petha.',
      cityIntroMarkdown: 'Agra’s Yamuna setting.\n\nBuild your visit around a base.',
      neighbourhoodsMarkdown: 'Intro line:\n\n- **Sadar Bazaar:** A shopping area.\n- **Kinari Bazaar:** Handicrafts.',
      thingsToDoMarkdown: '- **Taj Mahal:** White marble.',
      bestTimeMarkdown: 'October to March.',
      faqMarkdown: '**Is Agra good for dogs?**\nYes, with planning.',
    });
    expect(intro.title).toBe('Pet-Friendly Places in Agra');
    expect(intro.summary).toBe('White-marble heritage and petha.');
    expect(intro.sections.map(s => s.key)).toEqual([
      'about',
      'areas_to_know',
      'things_to_do',
      'best_time',
      'faq',
    ]);
    expect(intro.sections[0].body).toEqual(['Agra’s Yamuna setting.', 'Build your visit around a base.']);
    expect(intro.sections[1].body).toEqual([
      'Intro line:',
      '\u2022 Sadar Bazaar: A shopping area.',
      '\u2022 Kinari Bazaar: Handicrafts.',
    ]);
    expect(intro.sections[4].body).toEqual(['Is Agra good for dogs?', 'Yes, with planning.']);
  });

  it('reads the real /cities/intros?city_slug=agonda response', () => {
    const intro = normalizeIntro(AGONDA_INTRO);
    expect(intro.title).toBe('Pet-Friendly Places in Agonda');
    expect(intro.summary).toBe(AGONDA_INTRO.tagline);
    expect(intro.sections.map(s => s.key)).toEqual([
      'about',
      'getting_there',
      'pet_safety',
      'areas_to_know',
      'things_to_do',
      'best_time',
      'faq',
    ]);
    // Bullets keep their label without markdown marks
    expect(intro.sections[3].body).toContain(
      '\u2022 Agonda: A distinct revenue village and beach destination in Canacona.'
    );
    // A link keeps its text only
    expect(intro.sections[5].body.join(' ')).toContain('Consult IMD Goa’s forecasts and warnings before');
    expect(intro.sections[5].body.join(' ')).not.toContain('](');
    // FAQ: headings become plain questions, and the --- rules between entries are dropped
    const faq = intro.sections[6].body;
    expect(faq[0]).toBe('Is Agonda part of Palolem?');
    expect(faq.some(line => line.includes('---') || line.includes('##'))).toBe(false);
    expect(faq).toHaveLength(6);
  });

  it('reads camelCase category intros with the first paragraph as the tagline', () => {
    expect(
      categoryTaglines(
        [{ citySlug: 'agra', categoryLabel: 'Cafes', introMarkdown: '**Cafes** in Agra.\n\nMore.' }],
        'agra',
      ),
    ).toEqual({ Cafes: 'Cafes in Agra.' });
  });

  it('reads taglines, routes and nearby cities', () => {
    expect(categoryTaglines([{ category: 'Stays', tagline: 'Sleep easy' }], 'agonda')).toEqual({
      Stays: 'Sleep easy',
    });
    expect(readRoutes([{ slug: 'r', title: 'T', origin_city: 'Delhi', destination_city: 'Agonda' }])[0].subtitle).toBe('Delhi to Agonda');
    expect(readNearby([{ name: 'Agonda' }, { name: 'Palolem', state: 'Goa', verified_count: 3 }], 'Agonda')).toEqual([
      { city: 'Palolem', state: 'Goa', verified: 3 },
    ]);
  });
});
