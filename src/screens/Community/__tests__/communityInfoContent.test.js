import { COMMUNITY_INFO_TITLE, COMMUNITY_INFO_BLOCKS } from '../communityInfoContent';

const textOfBlock = block =>
  (block.parts || []).map(part => (typeof part === 'string' ? part : part.b)).join('') || block.text || '';

describe('Tails Community text (the website copy)', () => {
  it('is titled About Tails Community', () => {
    expect(COMMUNITY_INFO_TITLE).toBe('About Tails Community');
  });

  it('has the four website sections, in order', () => {
    const sections = COMMUNITY_INFO_BLOCKS.filter(block => block.type === 'h2').map(block => block.text);

    expect(sections).toEqual([
      "Why India's pet parents needed a place like this",
      'Lessons the road taught us (so you can skip the hard way)',
      'The questions this community was built for',
      'Frequently asked questions',
    ]);
  });

  it('has the six questions and answers of the website FAQ', () => {
    const faqs = COMMUNITY_INFO_BLOCKS.filter(block => block.type === 'faq');

    expect(faqs.map(faq => faq.q)).toEqual([
      'Is there an online community or forum for pet parents in India?',
      'How is this different from a WhatsApp pet group?',
      'Can I trust the advice here?',
      'Is Tails Community free?',
      'I run a pet business. Can I participate?',
      'My dog is an indie. Is this community for me?',
    ]);
    faqs.forEach(faq => expect(faq.a.length).toBeGreaterThan(40));
  });

  it('has the lessons from the road with their two callout boxes', () => {
    const headings = COMMUNITY_INFO_BLOCKS.filter(block => block.type === 'h3').map(block => block.text);
    const callouts = COMMUNITY_INFO_BLOCKS.filter(block => block.type === 'callout').map(block => block.title);

    expect(headings).toEqual([
      '“Pet friendly” on the internet means almost nothing',
      'The real question is always about the fine print',
      'Your vaccination card is a travel document, treat it like one',
      'The hills are wonderful, and they have their own rules',
    ]);
    expect(callouts).toEqual(['Ask the narrower question', 'Leopard country is real']);
  });

  it('keeps the website wording of the opening and closing paragraphs', () => {
    const all = COMMUNITY_INFO_BLOCKS.map(textOfBlock).join('\n');

    expect(all).toMatch(/Every day, somewhere in India, a pet parent types a question into a WhatsApp group/);
    expect(all).toMatch(/Tails Community exists to break that loop/);
    expect(all).toMatch(/public, permanent, and searchable/);
    expect(all).toMatch(/What gets solved here, stays solved\./);
    expect(all).toMatch(/The practical ones:/);
    expect(all).toMatch(/The first-timer ones:/);
    expect(all).toMatch(/The local ones:/);
  });
});
