import { bookPages, healthFileSource } from '../HealthBook';
import { API_BASE_URL } from '../../../../services/api/apiList';

describe('health book pages', () => {
  it('builds the authenticated image request from the record and file IDs', () => {
    const source = healthFileSource('pet-1', 'rec-2', 'file-3', 'tok');

    expect(source.uri).toBe(
      `${API_BASE_URL}/pets/pet-1/health-records/rec-2/files/file-3?variant=processed`,
    );
    expect(source.headers).toEqual({ Authorization: 'Bearer tok' });
  });

  it('sends no Authorization header when there is no token', () => {
    expect(healthFileSource('p', 'r', 'f', undefined).headers).toBeUndefined();
  });

  it('shows a page for a file the API describes only by ID', () => {
    const records = [{ id: 'rec-2', documentType: 'vaccination', files: [{ id: 'file-3' }] }];

    const pages = bookPages(records, 'pet-1', 'tok');

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toBe('Vaccination');
    expect(pages[0].source.uri).toContain('/pets/pet-1/health-records/rec-2/files/file-3');
    expect(pages[0].source.headers.Authorization).toBe('Bearer tok');
  });

  it('reads the file ID from fileId or file_id as well', () => {
    const records = [
      { id: 1, files: [{ fileId: 'a' }, { file_id: 'b' }] },
    ];

    const pages = bookPages(records, 'pet-1', 'tok');

    expect(pages.map(page => page.source.uri.split('/files/')[1].split('?')[0])).toEqual(['a', 'b']);
  });

  it('uses a file address as it is when the API already sends one', () => {
    const records = [{ id: 1, files: [{ id: 9, url: 'https://x.test/p1.jpg' }] }];

    const pages = bookPages(records, 'pet-1', 'tok');

    expect(pages[0].source).toEqual({ uri: 'https://x.test/p1.jpg' });
  });

  it('skips a file that has neither an address nor an ID, and a record with no files', () => {
    const records = [{ id: 1, files: [{}] }, { id: 2 }];

    expect(bookPages(records, 'pet-1', 'tok')).toEqual([]);
  });

  it('cannot build a request without the pet ID', () => {
    expect(bookPages([{ id: 1, files: [{ id: 'f' }] }], undefined, 'tok')).toEqual([]);
  });
});

describe('health book page viewer', () => {
  const React = require('react');
  const { render, fireEvent } = require('@testing-library/react-native');
  const { HealthBook } = require('../HealthBook');

  const records = [
    {
      id: 'rec-1',
      documentType: 'vaccination',
      recordName: 'Rabies booster',
      dateIssued: '2026-03-05T00:00:00Z',
      clinicName: 'Happy Paws',
      files: [{ id: 'f1', fileName: 'first.jpg' }, { id: 'f2' }],
    },
    { id: 'rec-2', documentType: 'deworming', files: [{ id: 'f3' }] },
  ];

  const setup = () => render(<HealthBook records={records} petId="pet-1" isDarkMode={false} />);

  it('counts the pages and starts on page 1 of 3, like the website', () => {
    const { getByText, getByTestId } = setup();

    expect(getByText('3 pages')).toBeTruthy();
    expect(getByTestId('health-page-count').props.children).toBe('Page 1 of 3');
    expect(getByText('first.jpg')).toBeTruthy();
    expect(getByText('Stored original')).toBeTruthy();
  });

  it('shows the record details beside the page', () => {
    const { getByText } = setup();

    expect(getByText('Rabies booster')).toBeTruthy();
    expect(getByText('2026-03-05')).toBeTruthy();
    expect(getByText('Happy Paws')).toBeTruthy();
    expect(getByText('Vaccination')).toBeTruthy();
    expect(getByText('Not added')).toBeTruthy(); // next due
  });

  it('moves with Next and Previous, and disables them at the ends', () => {
    const { getByTestId } = setup();
    const count = () => getByTestId('health-page-count').props.children;

    expect(getByTestId('health-page-prev').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(getByTestId('health-page-next'));
    expect(count()).toBe('Page 2 of 3');
    fireEvent.press(getByTestId('health-page-next'));
    expect(count()).toBe('Page 3 of 3');
    expect(getByTestId('health-page-next').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(getByTestId('health-page-prev'));
    expect(count()).toBe('Page 2 of 3');
  });

  it('shows the details of the record the current page belongs to', () => {
    const { getByTestId, getByText, queryByText } = setup();

    fireEvent.press(getByTestId('health-thumb-2'));

    expect(getByTestId('health-page-count').props.children).toBe('Page 3 of 3');
    expect(getByText('Deworming')).toBeTruthy();
    expect(queryByText('Rabies booster')).toBeNull();
  });

  it('jumps to a page from its thumbnail', () => {
    const { getByTestId } = setup();

    fireEvent.press(getByTestId('health-thumb-1'));

    expect(getByTestId('health-page-count').props.children).toBe('Page 2 of 3');
  });

  it('rotates the page a quarter turn at a time and remembers it per page', () => {
    const { getByTestId } = setup();
    const rotation = () =>
      Object.assign({}, ...[].concat(getByTestId('health-page-image').props.style).flat())
        .transform[0].rotate;

    expect(rotation()).toBe('0deg');
    fireEvent.press(getByTestId('health-page-rotate'));
    expect(rotation()).toBe('90deg');
    fireEvent.press(getByTestId('health-thumb-1'));
    expect(rotation()).toBe('0deg');
    fireEvent.press(getByTestId('health-thumb-0'));
    expect(rotation()).toBe('90deg');
    ['a', 'b', 'c'].forEach(() => fireEvent.press(getByTestId('health-page-rotate')));
    expect(rotation()).toBe('0deg');
  });

  it('shows the empty message when no record has a photo', () => {
    const { getByText } = render(
      <HealthBook records={[{ id: 'x', documentType: 'other', files: [] }]} petId="pet-1" />,
    );

    expect(getByText('No pages yet')).toBeTruthy();
  });

  it('offers Remove page only when it can be acted on', () => {
    const noHandler = render(<HealthBook records={records} petId="pet-1" />);
    expect(noHandler.queryByTestId('health-page-remove')).toBeNull();
    noHandler.unmount();

    const onRemovePage = jest.fn();
    const { getByTestId, getByText } = render(
      <HealthBook records={records} petId="pet-1" onRemovePage={onRemovePage} />,
    );
    expect(getByText('Remove page')).toBeTruthy();

    fireEvent.press(getByTestId('health-thumb-2'));
    fireEvent.press(getByTestId('health-page-remove'));

    expect(onRemovePage).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'rec-2', fileId: 'f3' }),
    );
  });

  it('keeps the viewer on a valid page after the last page goes', () => {
    const { getByTestId, rerender } = render(<HealthBook records={records} petId="pet-1" />);
    fireEvent.press(getByTestId('health-thumb-2'));

    rerender(<HealthBook records={[records[0]]} petId="pet-1" />);

    expect(getByTestId('health-page-count').props.children).toBe('Page 2 of 2');
  });

  describe('full-screen view', () => {
    it('stays closed until the photo is tapped', () => {
      const { queryByTestId } = setup();

      expect(queryByTestId('health-viewer')).toBeNull();
    });

    it('opens on the page that was tapped, with every page counted', () => {
      const { getByTestId } = setup();

      fireEvent.press(getByTestId('health-thumb-1'));
      fireEvent.press(getByTestId('health-page-open'));

      expect(getByTestId('health-viewer')).toBeTruthy();
      expect(getByTestId('health-viewer-count').props.children).toBe('2 / 3');
    });

    it('goes through the pages with Next and Previous, disabled at the ends', () => {
      const { getByTestId } = setup();
      fireEvent.press(getByTestId('health-page-open'));
      const count = () => getByTestId('health-viewer-count').props.children;

      expect(count()).toBe('1 / 3');
      expect(getByTestId('health-viewer-prev').props.accessibilityState.disabled).toBe(true);
      fireEvent.press(getByTestId('health-viewer-next'));
      fireEvent.press(getByTestId('health-viewer-next'));
      expect(count()).toBe('3 / 3');
      expect(getByTestId('health-viewer-next').props.accessibilityState.disabled).toBe(true);
      fireEvent.press(getByTestId('health-viewer-prev'));
      expect(count()).toBe('2 / 3');
    });

    it('swipes to another page', () => {
      const { getByTestId } = setup();
      fireEvent.press(getByTestId('health-page-open'));

      fireEvent(getByTestId('health-viewer-list'), 'momentumScrollEnd', {
        nativeEvent: { contentOffset: { x: 2 * require('react-native').Dimensions.get('window').width } },
      });

      expect(getByTestId('health-viewer-count').props.children).toBe('3 / 3');
    });

    it('closes on the close button and keeps the page that was reached', () => {
      const { getByTestId, queryByTestId } = setup();
      fireEvent.press(getByTestId('health-page-open'));
      fireEvent.press(getByTestId('health-viewer-next'));

      fireEvent.press(getByTestId('health-viewer-close'));

      expect(queryByTestId('health-viewer')).toBeNull();
      expect(getByTestId('health-page-count').props.children).toBe('Page 2 of 3');
    });
  });

  describe('changing page without flicker', () => {
    const opacityOf = element =>
      Object.assign({}, ...[].concat(element.props.style).flat()).opacity;

    it('keeps every page picture mounted, so none reloads when the page changes', () => {
      const { getByTestId, getAllByTestId } = setup();
      const before = getAllByTestId('fast-image-placeholder').length;

      fireEvent.press(getByTestId('health-page-next'));
      fireEvent.press(getByTestId('health-page-next'));
      fireEvent.press(getByTestId('health-page-prev'));

      // One per page in the big view plus the three thumbnails: nothing added or replaced
      expect(before).toBe(6);
      expect(getAllByTestId('fast-image-placeholder')).toHaveLength(6);
    });

    it('shows only the current page picture', () => {
      const { getByTestId } = setup();

      expect(opacityOf(getByTestId('health-page-image'))).toBe(1);
      fireEvent.press(getByTestId('health-page-next'));
      expect(opacityOf(getByTestId('health-page-image'))).toBe(1);
      expect(getByTestId('health-page-count').props.children).toBe('Page 2 of 3');
    });
  });
});
