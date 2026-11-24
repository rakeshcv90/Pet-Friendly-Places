import { parseFaqs } from '../routeFaq';

// The three ways the live routes write their FAQs
const BOLD =
  '**How far is Delhi from Bhimtal?**\nApproximately 295 km from central Delhi. Drive time 7–8 hours.\n\n' +
  '**Can I take my dog?**\nYes. Both verified dhabas on this route accept dogs.\n\n' +
  '**Are there tolls?**\nYes, several on NH24. Keep FASTag active.';

const HEADINGS =
  '### How often should you stop with a dog on a long car ride?\nEvery 2 to 3 hours, for water, a stretch, and a bathroom break.\n\n' +
  "### Is it safe to leave a dog in the car during a short stop?\nNot for anything beyond a couple of minutes, and never with the car fully shut.\n\n" +
  '### What is the best route from Delhi to Pune with a dog?\nDelhi, Jaipur, Udaipur, Ahmedabad, Vadodara, Surat, then the Mumbai-Pune Expressway.';

const TITLE_THEN_BOLD =
  '## Frequently asked questions\n\n' +
  '**Is the Delhi-Dehradun Expressway pet friendly?**\nThe expressway itself is just a road.\n\n' +
  '**Are there fuel stations on the Delhi-Dehradun Expressway?**\nNo. Fill your tank completely before entering.';

describe('parseFaqs', () => {
  it('reads questions written as bold lines', () => {
    const faqs = parseFaqs(BOLD);

    expect(faqs).toHaveLength(3);
    expect(faqs[0]).toEqual({
      question: 'How far is Delhi from Bhimtal?',
      answer: 'Approximately 295 km from central Delhi. Drive time 7–8 hours.',
    });
    expect(faqs[2].question).toBe('Are there tolls?');
  });

  it('reads questions written as headings, like Delhi to Pune', () => {
    const faqs = parseFaqs(HEADINGS);

    expect(faqs).toHaveLength(3);
    expect(faqs[0].question).toBe('How often should you stop with a dog on a long car ride?');
    expect(faqs[0].answer).toBe('Every 2 to 3 hours, for water, a stretch, and a bathroom break.');
    expect(faqs[2].question).toBe('What is the best route from Delhi to Pune with a dog?');
  });

  it('skips a title above the questions, like Delhi to Dehradun', () => {
    const faqs = parseFaqs(TITLE_THEN_BOLD);

    expect(faqs.map(faq => faq.question)).toEqual([
      'Is the Delhi-Dehradun Expressway pet friendly?',
      'Are there fuel stations on the Delhi-Dehradun Expressway?',
    ]);
  });

  it('keeps a long answer with its paragraphs together', () => {
    const [faq] = parseFaqs('### Q?\nFirst paragraph.\n\nSecond paragraph.\n\n\n\nThird.');

    expect(faq.answer).toBe('First paragraph.\n\nSecond paragraph.\n\nThird.');
  });

  it('keeps an answer that has bold words in it, without the stars', () => {
    const [faq] = parseFaqs('**Is it safe?**\nYes, but **never** leave a dog in a hot car.');

    expect(faq.answer).toBe('Yes, but never leave a dog in a hot car.');
  });

  it('keeps the words of a link and drops its address', () => {
    const [faq] = parseFaqs('### Where?\nTry [The Den](https://example.com/den) first.');

    expect(faq.answer).toBe('Try The Den first.');
  });

  it('cleans a question that has bold or a link in it', () => {
    const [faq] = parseFaqs('### Is **Udaipur** on the [route](/r)?\nYes.');

    expect(faq.question).toBe('Is Udaipur on the route?');
  });

  it('reads a bold question with its answer on the same line', () => {
    const [faq] = parseFaqs('**Are there tolls?** Yes, several.');

    expect(faq).toEqual({ question: 'Are there tolls?', answer: 'Yes, several.' });
  });

  it('does not take a bold phrase inside a sentence as a question', () => {
    const faqs = parseFaqs('### Q?\n**Note:** carry water. More text.');

    expect(faqs).toHaveLength(1);
    expect(faqs[0].answer).toBe('Note: carry water. More text.');
  });

  it('drops a question that has no answer', () => {
    expect(parseFaqs('### Lonely question?\n\n### Real one?\nAn answer.').map(faq => faq.question)).toEqual([
      'Real one?',
    ]);
  });

  it('copes with Windows line endings', () => {
    expect(parseFaqs('### Q?\r\nAnswer.\r\n')).toEqual([{ question: 'Q?', answer: 'Answer.' }]);
  });

  it('gives nothing for an empty or missing FAQ, or plain text with no questions', () => {
    expect(parseFaqs('')).toEqual([]);
    expect(parseFaqs(null)).toEqual([]);
    expect(parseFaqs(undefined)).toEqual([]);
    expect(parseFaqs('Just a paragraph with no questions in it.')).toEqual([]);
  });
});
