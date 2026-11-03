import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import { GuideDetailScreen, parseArticleBody, dropFurtherReading } from '../GuideDetailScreen';
import { formatCount, formatPublishedDate } from '../GuideDetail/format';
import { useArticleDetail } from '../../../hooks/useDiscovery';

jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve());

jest.mock('../../../hooks/useDiscovery', () => ({
  useArticleDetail: jest.fn(() => ({
    data: null,
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  })),
  useListingDetail: jest.fn(() => ({ data: null })),
  resolveImageUrl: url => url,
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const MOCK_GUIDE = {
  id: 'guide-test-1',
  slug: 'pet-friendly-staycation-gurgaon',
  title: 'Pet Friendly Staycation Near Gurgaon - 3 Private Villas',
  badgeText: 'Destination Guide',
  category: 'destinations',
  excerpt: 'Three verified pet-friendly private villas within 45 minutes of Gurgaon.',
  readTime: '8 min read',
  author: 'Ekta & Akash',
  tags: ['gurgaon', 'staycation', 'villa'],
};

describe('GuideDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useArticleDetail.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
  });

  it('renders guide title, author, excerpt, category pill and tags', () => {
    const { getByText, getAllByText } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { guide: MOCK_GUIDE } }}
      />,
    );

    expect(useArticleDetail).toHaveBeenCalledWith('pet-friendly-staycation-gurgaon');
    expect(getByText('Pet Friendly Staycation Near Gurgaon - 3 Private Villas')).toBeTruthy();
    expect(getByText('Destination Guide')).toBeTruthy();
    expect(getAllByText('Ekta & Akash').length).toBeGreaterThan(0);
    expect(getByText('8 min read')).toBeTruthy();
    expect(
      getByText('Three verified pet-friendly private villas within 45 minutes of Gurgaon.'),
    ).toBeTruthy();
    // Tags section
    expect(getByText('gurgaon')).toBeTruthy();
    expect(getByText('staycation')).toBeTruthy();
  });

  it('calls useArticleDetail with slug and renders data fetched from GET /articles/:slug', () => {
    // a real hook returns the same data on every render (the body renders in a deferred pass)
    useArticleDetail.mockReturnValue({
      data: {
        article: {
          id: 'api-art-1',
          slug: 'jim-corbett-road-trip',
          title: 'Jim Corbett Road Trip with Dogs',
          category: 'destinations',
          authorName: 'Apple The Golden Pack',
          body: '<p>A thrilling road trip to Jim Corbett national park.</p><ul><li>Carry plenty of dog food</li></ul>',
        },
      },
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText, getAllByText } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { slug: 'jim-corbett-road-trip' } }}
      />,
    );

    expect(useArticleDetail).toHaveBeenCalledWith('jim-corbett-road-trip');
    expect(getByText('Jim Corbett Road Trip with Dogs')).toBeTruthy();
    expect(getAllByText('Apple The Golden Pack').length).toBeGreaterThan(0);
    expect(
      getAllByText('A thrilling road trip to Jim Corbett national park.').length,
    ).toBeGreaterThan(0);
    expect(getAllByText('Carry plenty of dog food').length).toBeGreaterThan(0);
  });

  it('renders fullScreen loader when isDetailLoading is true and guide is not yet loaded', () => {
    useArticleDetail.mockReturnValueOnce({
      data: null,
      isLoading: true,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const { getByText } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { slug: 'loading-slug' } }}
      />,
    );

    expect(getByText('Loading pet guide...')).toBeTruthy();
  });

  it('calls navigation.goBack when header back button is pressed', () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { guide: MOCK_GUIDE } }}
      />,
    );

    const backBtn = getByTestId('guide-back-button');
    fireEvent.press(backBtn);

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('calls navigation.goBack when "Done" button is pressed', () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { guide: MOCK_GUIDE } }}
      />,
    );

    const doneBtn = getByTestId('guide-done-reading-button');
    fireEvent.press(doneBtn);

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('triggers Share.share when top share button is pressed', async () => {
    const { getByTestId } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { guide: MOCK_GUIDE } }}
      />,
    );

    const shareBtn = getByTestId('guide-share-button');
    fireEvent.press(shareBtn);

    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: MOCK_GUIDE.title,
          message: expect.stringContaining(MOCK_GUIDE.title),
        }),
      );
    });
  });

  it('parses raw HTML body: paragraphs, bullet list, callout, h2 heading', () => {
    const html = `
      <p class="guide-intro">Intro paragraph here.</p>
      <p>Regular paragraph.</p>
      <h2>Section Title</h2>
      <div class="brush-callout teal">
        <div class="brush-title">Pet policy</div>
        <div class="brush-body">Dogs welcome. No extra charge.</div>
      </div>
      <ul><li>Carry water</li><li>Leash in public</li></ul>
    `;
    const nodes = parseArticleBody(html);

    const types = nodes.map(n => n.type);
    expect(types).toContain('paragraph');
    expect(types).toContain('heading');
    expect(types).toContain('callout');
    expect(types).toContain('list');

    const headingNode = nodes.find(n => n.type === 'heading');
    expect(headingNode.text).toBe('Section Title');

    const calloutNode = nodes.find(n => n.type === 'callout');
    expect(calloutNode.color).toBe('teal');
    expect(calloutNode.title).toBe('Pet policy');
    expect(calloutNode.body).toContain('Dogs welcome');

    const listNode = nodes.find(n => n.type === 'list');
    expect(listNode.items).toEqual(['Carry water', 'Leash in public']);
  });

  it('parses the live article shapes: stats, nested callouts, inline marks, links, embeds', () => {
    const html = `<article class="guide-body">
      <div class="article-stats">
        <div class="article-stat"><span class="article-stat-icon">🏡</span><div class="article-stat-value">3 villas</div><div class="article-stat-label">All fenced</div></div>
        <div class="article-stat"><span class="article-stat-icon">🚗</span><div class="article-stat-value">45 min</div><div class="article-stat-label">From Gurgaon</div></div>
      </div>
      <p>Guest said <mark class="keyword-highlight hl-teal">our lab ran all day</mark> here.</p>
      <div class="brush-callout teal">
        <div class="brush-title">Pet policy</div>
        <div class="brush-body">Dogs welcome.<br><br>No extra charge.</div>
      </div>
      <div class="listing-embed-placeholder" data-slug="aainaa-villa"/>
      <div class="tip-strip">
        <span class="tip-strip-icon">🐾</span>
        <p>Visit <a href="/places/panikot-lake">Panikot Lake</a> next.</p>
        <div class="listing-embed-placeholder" data-slug="panikot-lake"/>
      </div>
      <h2>Want to Go Further?</h2>
      <ul><li><a href="/guides/dog-travel-kit-india">Dog travel kit →</a></li></ul>
    </article>`;
    const nodes = parseArticleBody(html);

    expect(nodes.map(n => n.type)).toEqual([
      'stat-row',
      'paragraph',
      'callout',
      'listing-embed',
      'tip-strip',
      'listing-embed',
      'heading',
      'list',
    ]);
    expect(nodes[0].stats).toEqual([
      { icon: '🏡', value: '3 villas', label: 'All fenced' },
      { icon: '🚗', value: '45 min', label: 'From Gurgaon' },
    ]);
    expect(nodes[1].runs.find(r => r.mark).mark).toBe('teal');
    // the callout body must not repeat its title
    expect(nodes[2].body).toBe('Dogs welcome.\n\nNo extra charge.');
    expect(nodes[4].runs.find(r => r.href).href).toBe('/places/panikot-lake');
    expect(nodes[7].itemRuns[0][0].href).toBe('/guides/dog-travel-kit-india');
  });

  it('parses city directory grids and keeps FAQ line breaks clean', () => {
    const nodes = parseArticleBody(`
      <h2>City guides</h2>
      <div class="city-directory-grid">
        <a href="/guides/animal-shelters-delhi" class="city-card">
          <span class="city-name">Delhi</span>
          <span class="city-note">Friendicoes, PFA</span>
        </a>
        <a href="/guides/animal-shelters-rishikesh" class="city-card city-card-honest">
          <span class="city-name">Rishikesh</span>
          <span class="city-note">No dedicated local org</span>
        </a>
      </div>
      <p><strong>How current is this?</strong><br>
      Checked at the time of writing.</p>`);

    expect(nodes.map(n => n.type)).toEqual(['heading', 'city-grid', 'paragraph']);
    expect(nodes[1].cards).toEqual([
      { name: 'Delhi', note: 'Friendicoes, PFA', href: '/guides/animal-shelters-delhi', honest: false },
      {
        name: 'Rishikesh',
        note: 'No dedicated local org',
        href: '/guides/animal-shelters-rishikesh',
        honest: true,
      },
    ]);
    expect(nodes[2].text).toBe('How current is this?\nChecked at the time of writing.');
  });

  it('parses tables into a header row and body rows', () => {
    const nodes = parseArticleBody(`
      <h2>The Complete Schedule</h2>
      <table>
        <tr><th>Age</th><th>Vaccine</th></tr>
        <tr><td>6 weeks</td><td>Distemper, <strong>Hepatitis</strong></td></tr>
        <tr><td>9 weeks</td><td>DHPPi + Leptospirosis</td></tr>
      </table>
      <p>After.</p>`);

    expect(nodes.map(n => n.type)).toEqual(['heading', 'table', 'paragraph']);
    expect(nodes[1].header.map(c => c.text)).toEqual(['Age', 'Vaccine']);
    expect(nodes[1].rows.map(r => r.map(c => c.text))).toEqual([
      ['6 weeks', 'Distemper, Hepatitis'],
      ['9 weeks', 'DHPPi + Leptospirosis'],
    ]);
    expect(nodes[1].rows[0][1].runs.some(r => r.bold)).toBe(true);
  });

  it('renders a table from the article body', () => {
    const guide = {
      id: 'tbl',
      slug: 'tbl',
      title: 'Vaccination Schedule',
      body: '<table><tr><th>Age</th><th>Required?</th></tr><tr><td>12 weeks</td><td>YES - legally required</td></tr></table>',
    };
    const { getByText } = render(
      <GuideDetailScreen navigation={mockNavigation} route={{ params: { guide } }} />,
    );

    expect(getByText('Age')).toBeTruthy();
    expect(getByText('12 weeks')).toBeTruthy();
    expect(getByText('YES - legally required')).toBeTruthy();
  });

  it('formats the published date and view count like the website', () => {
    expect(formatPublishedDate('2026-05-22T23:03:25.492Z')).toBe('22 May 2026');
    expect(formatPublishedDate(null)).toBe('');
    expect(formatPublishedDate('not a date')).toBe('');
    expect(formatCount(20230)).toBe('20.2K');
    expect(formatCount(42000)).toBe('42K');
    expect(formatCount(1500000)).toBe('1.5M');
    expect(formatCount(842)).toBe('842');
    expect(formatCount(0)).toBe('');
  });

  it('shows read time, published date and views in the article header', () => {
    useArticleDetail.mockReturnValue({
      data: {
        id: 7,
        slug: 'vax',
        title: 'Dog Vaccination Schedule',
        category: 'pet-health',
        estimatedReadMinutes: 10,
        viewCount: 20230,
        publishedAt: '2026-05-22T23:03:25.492Z',
        body: '<p>Body.</p>',
      },
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const { getByText } = render(
      <GuideDetailScreen navigation={mockNavigation} route={{ params: { slug: 'vax' } }} />,
    );

    expect(getByText('10 min read')).toBeTruthy();
    expect(getByText('22 May 2026')).toBeTruthy();
    expect(getByText('20.2K views')).toBeTruthy();
  });

  it('shows the same Tails Team author box on every category', () => {
    mockNavigation.popTo = jest.fn();
    const rescue = { ...MOCK_GUIDE, category: 'guide', badgeText: 'Rescue & Welfare' };
    const { getByText } = render(
      <GuideDetailScreen navigation={mockNavigation} route={{ params: { guide: rescue } }} />,
    );

    expect(getByText('Tails Team')).toBeTruthy();
    expect(getByText(/Captain and Kimchi are the real authors/)).toBeTruthy();
    fireEvent.press(getByText(/Read our travel stories/));
    expect(mockNavigation.popTo).toHaveBeenCalledWith(
      'StoryGuidesScreen',
      expect.objectContaining({ initialTab: 'stories' }),
    );
    delete mockNavigation.popTo;
  });

  it('drops the "Want to Go Further?" heading and its link list', () => {
    const nodes = parseArticleBody(
      '<p>Body.</p><h2>Practical</h2><ul><li>Tip</li></ul><h2>Want to Go Further?</h2><ul><li><a href="/guides/x">X</a></li></ul>',
    );
    const kept = dropFurtherReading(nodes);
    expect(kept.map(n => n.type)).toEqual(['paragraph', 'heading', 'list']);
    expect(kept.some(n => n.text === 'Want to Go Further?')).toBe(false);
  });

  it('renders parsed HTML body nodes in the screen from rawBody on guide', () => {
    const rawGuide = {
      id: 'raw-1',
      slug: 'raw-1',
      title: 'Guide with Raw HTML Body',
      badgeText: 'Pet Health',
      body: '<p>First raw paragraph.</p><p>Second raw paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul>',
    };

    const { getByText, getAllByText } = render(
      <GuideDetailScreen
        navigation={mockNavigation}
        route={{ params: { guide: rawGuide } }}
      />,
    );

    expect(getByText('Guide with Raw HTML Body')).toBeTruthy();
    expect(getAllByText('First raw paragraph.').length).toBeGreaterThan(0);
    expect(getByText('Second raw paragraph.')).toBeTruthy();
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });

  it('renders empty state when no guide is provided in params and loading is false', () => {
    const { getByText } = render(
      <GuideDetailScreen navigation={mockNavigation} route={{ params: {} }} />,
    );

    expect(getByText('Guide Not Found')).toBeTruthy();
    const backBtn = getByText('Back to Guides');
    fireEvent.press(backBtn);

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
