/** Article HTML -> typed content nodes (no React / React Native imports). */

export const decodeEntities = str =>
  str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .replace(/&amp;/g, '&');

/**
 * Strips HTML tags from a string, decoding basic entities.
 */
export const stripTags = html => decodeEntities((html || '').replace(/<[^>]+>/g, '')).trim();

const MARK_CLASS_RE = /hl-(purple|teal|amber|coral|gold)/i;

/**
 * Parses inline HTML into styled text runs: { text, bold?, mark?, href? }.
 * Keeps <strong>/<b>, <mark class="keyword-highlight hl-*">, <a href> and <br>.
 */
const parseInline = html => {
  const runs = [];
  let boldDepth = 0;
  const markStack = [];
  const hrefStack = [];

  const pushText = (raw, keepSpace) => {
    let text = decodeEntities(keepSpace ? raw : raw.replace(/\s+/g, ' '));
    const before = runs[runs.length - 1];
    if (!keepSpace && before && before.text.endsWith('\n')) {
      text = text.replace(/^\s+/, '');
    }
    if (!text) {
      return;
    }
    const run = { text };
    if (boldDepth > 0) {
      run.bold = true;
    }
    if (markStack.length) {
      run.mark = markStack[markStack.length - 1];
    }
    if (hrefStack.length) {
      run.href = hrefStack[hrefStack.length - 1];
    }
    const prev = runs[runs.length - 1];
    if (prev && prev.bold === run.bold && prev.mark === run.mark && prev.href === run.href) {
      prev.text += run.text;
    } else {
      runs.push(run);
    }
  };

  const tagRe = /<(\/?)([a-z0-9]+)([^>]*)>/gi;
  let last = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    pushText(html.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';

    if (tag === 'br') {
      pushText('\n', true);
    } else if (tag === 'strong' || tag === 'b') {
      boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1));
    } else if (tag === 'mark') {
      if (closing) {
        markStack.pop();
      } else {
        const color = attrs.match(MARK_CLASS_RE);
        markStack.push(color ? color[1].toLowerCase() : 'default');
      }
    } else if (tag === 'a') {
      if (closing) {
        hrefStack.pop();
      } else {
        const href = attrs.match(/href="([^"]*)"/i);
        hrefStack.push(href ? decodeEntities(href[1]) : null);
      }
    }
  }
  pushText(html.slice(last));

  if (runs.length) {
    runs[0].text = runs[0].text.replace(/^\s+/, '');
    runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, '');
  }
  return runs.filter(r => r.text);
};

export const runsToText = runs => runs.map(r => r.text).join('');
export const hasFormatting = runs => runs.some(r => r.bold || r.mark || r.href);

/**
 * Replaces every <div class="<className> ..."> ... </div> block, counting nested divs,
 * with the string returned by fn(openTag, innerHtml).
 */
const replaceDivBlocks = (html, className, fn) => {
  const openRe = new RegExp(`<div\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'i');
  let out = '';
  let rest = html;
  for (;;) {
    const open = openRe.exec(rest);
    if (!open) {
      return out + rest;
    }
    const tagRe = /<(\/?)div\b[^>]*>/gi;
    tagRe.lastIndex = open.index + open[0].length;
    let depth = 1;
    let tag;
    while (depth > 0 && (tag = tagRe.exec(rest))) {
      depth += tag[1] ? -1 : 1;
    }
    const innerEnd = tag ? tag.index : rest.length;
    const end = tag ? tagRe.lastIndex : rest.length;
    out +=
      rest.slice(0, open.index) + fn(open[0], rest.slice(open.index + open[0].length, innerEnd));
    rest = rest.slice(end);
  }
};


export const parseArticleBody = body => {
  if (!body) {
    return [];
  }
  const stash = [];
  const stashNode = node => {
    stash.push(node);
    return `<!--N${stash.length - 1}-->`;
  };

  let html = String(body)
    .replace(/<\/?article[^>]*>/gi, '')
    .replace(/<!--(?!N\d+-->)[\s\S]*?-->/g, '');

  // tables -> one node (header row + body rows, every cell keeps its inline formatting)
  html = html.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, inner) => {
    const rows = [...inner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(tr =>
      [...tr[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(cell => {
        const runs = parseInline(cell[2]);
        return { text: runsToText(runs), runs, isHeader: cell[1].toLowerCase() === 'th' };
      }),
    ).filter(row => row.length);
    if (!rows.length) {
      return '';
    }
    const hasHeader = rows[0].every(cell => cell.isHeader);
    return stashNode({
      type: 'table',
      header: hasHeader ? rows[0] : null,
      rows: hasHeader ? rows.slice(1) : rows,
    });
  });

  // listing embeds (self-closing or wrapped), stashed first so they survive inside other blocks
  html = html.replace(/<div\b[^>]*listing-embed-placeholder[^>]*>(\s*<\/div>)?/gi, (tag, closing) => {
    const slug = (tag.match(/data-slug="([^"]+)"/i) || [])[1];
    const selfClosed = /\/>$/.test(tag.replace(/\s*<\/div>$/i, ''));
    // a self-closed embed must not eat the closing </div> of the block that wraps it
    const leftover = selfClosed ? closing || '' : '';
    return (slug ? stashNode({ type: 'listing-embed', slug }) : '') + leftover;
  });

  html = replaceDivBlocks(html, 'city-directory-grid', (_, inner) => {
    const cards = [...inner.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
      .map(m => ({
        href: decodeEntities((m[1].match(/href="([^"]*)"/i) || [])[1] || ''),
        honest: /city-card-honest/.test(m[1]),
        name: stripTags((m[2].match(/city-name[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ''),
        note: stripTags((m[2].match(/city-note[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || ''),
      }))
      .filter(card => card.name);
    return cards.length ? stashNode({ type: 'city-grid', cards }) : '';
  });

  html = replaceDivBlocks(html, 'article-stats', (_, inner) => {
    const stats = [
      ...inner.matchAll(
        /article-stat-icon[^>]*>([\s\S]*?)<\/span>[\s\S]*?article-stat-value[^>]*>([\s\S]*?)<\/div>[\s\S]*?article-stat-label[^>]*>([\s\S]*?)<\/div>/gi,
      ),
    ].map(m => ({ icon: stripTags(m[1]), value: stripTags(m[2]), label: stripTags(m[3]) }));
    return stats.length ? stashNode({ type: 'stat-row', stats }) : '';
  });

  html = replaceDivBlocks(html, 'brush-callout', (open, inner) => {
    const color = (open.match(/\b(purple|teal|amber|coral|gold)\b/i) || [])[1] || 'default';
    const titleHtml = (inner.match(/<div[^>]*brush-title[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || '';
    let bodyHtml = '';
    replaceDivBlocks(inner, 'brush-body', (_, bodyInner) => {
      bodyHtml = bodyInner;
      return '';
    });
    if (!bodyHtml) {
      bodyHtml = inner.replace(/<div[^>]*brush-title[^>]*>[\s\S]*?<\/div>/i, '');
    }
    const runs = parseInline(bodyHtml.replace(/<\/p>\s*<p[^>]*>/gi, '<br><br>'));
    return stashNode({
      type: 'callout',
      color: color.toLowerCase(),
      title: runsToText(parseInline(titleHtml)),
      body: runsToText(runs).trim(),
      runs,
    });
  });

  html = replaceDivBlocks(html, 'tip-strip', (_, inner) => {
    const embeds = inner.match(/<!--N\d+-->/g) || [];
    const clean = inner.replace(/<!--N\d+-->/g, '');
    const icon = stripTags((clean.match(/tip-strip-icon[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
    const bodyHtml = (clean.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1] ||
      clean.replace(/<span[^>]*tip-strip-icon[^>]*>[\s\S]*?<\/span>/i, '');
    const runs = parseInline(bodyHtml);
    return (
      stashNode({ type: 'tip-strip', icon: icon || '🐾', text: runsToText(runs), runs }) +
      embeds.join('')
    );
  });

  html = replaceDivBlocks(html, 'paw-divider', () => stashNode({ type: 'divider' }));

  // ── Walk remaining markup in document order ─────────────────────────
  const nodes = [];
  const blockRe =
    /<!--N(\d+)-->|<h([23])[^>]*>([\s\S]*?)<\/h\2>|<(ul|ol)[^>]*>([\s\S]*?)<\/\4>|<p([^>]*)>([\s\S]*?)<\/p>|<hr\s*\/?>/gi;
  let m;
  while ((m = blockRe.exec(html))) {
    if (m[1] !== undefined) {
      nodes.push(stash[Number(m[1])]);
    } else if (m[2]) {
      const text = runsToText(parseInline(m[3]));
      if (text) {
        nodes.push({ type: 'heading', level: Number(m[2]), text });
      }
    } else if (m[4]) {
      const itemRuns = [...m[5].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(li => parseInline(li[1]))
        .filter(r => r.length);
      if (itemRuns.length) {
        nodes.push({
          type: 'list',
          items: itemRuns.map(runsToText),
          itemRuns,
          ordered: m[4].toLowerCase() === 'ol',
        });
      }
    } else if (m[7] !== undefined) {
      const strongOnly = m[7].match(/^\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>\s*$/i);
      if (strongOnly) {
        const text = runsToText(parseInline(strongOnly[2]));
        if (text) {
          nodes.push({ type: 'strong', text });
        }
      } else {
        const runs = parseInline(m[7]);
        const text = runsToText(runs);
        if (text) {
          nodes.push({ type: 'paragraph', text, runs, isIntro: /guide-intro/.test(m[6] || '') });
        }
      }
    } else {
      nodes.push({ type: 'divider' });
    }
  }

  return nodes;
};

/* ─── Callout Color Tokens ────────────────────────────────────────────── */

export const dropFurtherReading = nodes => {
  const idx = nodes.findIndex(
    n => n.type === 'heading' && /^want to go further\??$/i.test(n.text.trim()),
  );
  if (idx === -1) {
    return nodes;
  }
  const next = nodes[idx + 1];
  return nodes.filter((_, i) => i !== idx && !(i === idx + 1 && next && next.type === 'list'));
};
