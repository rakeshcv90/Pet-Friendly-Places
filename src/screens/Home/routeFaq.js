// The "Frequently asked" questions of a road trip route. The API sends them as markdown, and routes are
// written in a few different ways:
//   **Question?**            a bold line
//   ### Question?            a heading line
//   ## Frequently asked...   a title above the questions (it has no answer, so it is skipped)
// Each question runs until the next question line.

const stripInline = text =>
  String(text || '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [words](link) -> words
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // **bold** -> bold
    .trim();

const cleanAnswer = lines =>
  stripInline(lines.join('\n'))
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const parseFaqs = markdown => {
  const lines = String(markdown || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  const faqs = [];
  let current = null;

  const finish = () => {
    if (current) {
      const answer = cleanAnswer(current.lines);
      // A heading with nothing under it is a title, not a question
      if (current.question && answer) {
        faqs.push({ question: current.question, answer });
      }
    }
    current = null;
  };

  lines.forEach(line => {
    const heading = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    const bold = /^\s*\*\*(.+?)\*\*\s*(.*)$/.exec(line);
    // A bold line is a question when it stands alone, or when it ends in "?" with the answer after it
    const boldQuestion = bold && (bold[2] === '' || bold[1].trim().endsWith('?')) ? bold : null;

    if (heading) {
      finish();
      current = { question: stripInline(heading[1]), lines: [] };
    } else if (boldQuestion) {
      finish();
      current = { question: stripInline(boldQuestion[1]), lines: boldQuestion[2] ? [boldQuestion[2]] : [] };
    } else if (current) {
      current.lines.push(line);
    }
  });
  finish();

  return faqs;
};
