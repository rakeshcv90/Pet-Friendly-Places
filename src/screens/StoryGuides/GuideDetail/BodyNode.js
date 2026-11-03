import React from 'react';
import { ListingEmbed } from './ListingEmbed';
import { StatRow, SectionHeading, Paragraph, StrongLine, Callout, BulletList, TipStrip, CityGrid, SectionDivider } from './BodyBlocks';
import { DataTable } from './DataTable';

export const BodyNode = React.memo(function BodyNode({ node, isDarkMode, onLinkPress }) {
  switch (node.type) {
    case 'stat-row':
      return <StatRow stats={node.stats} isDarkMode={isDarkMode} />;
    case 'heading':
      return <SectionHeading level={node.level} text={node.text} isDarkMode={isDarkMode} />;
    case 'paragraph':
      return (
        <Paragraph
          text={node.text}
          runs={node.runs}
          isIntro={node.isIntro}
          isDarkMode={isDarkMode}
          onLinkPress={onLinkPress}
        />
      );
    case 'strong':
      return <StrongLine text={node.text} isDarkMode={isDarkMode} />;
    case 'callout':
      return (
        <Callout
          color={node.color}
          title={node.title}
          body={node.body}
          runs={node.runs}
          isDarkMode={isDarkMode}
          onLinkPress={onLinkPress}
        />
      );
    case 'list':
      return <BulletList node={node} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />;
    case 'tip-strip':
      return <TipStrip node={node} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />;
    case 'table':
      return (
        <DataTable
          header={node.header}
          rows={node.rows}
          isDarkMode={isDarkMode}
          onLinkPress={onLinkPress}
        />
      );
    case 'city-grid':
      return <CityGrid cards={node.cards} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />;
    case 'listing-embed':
      return <ListingEmbed slug={node.slug} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />;
    case 'divider':
      return <SectionDivider isDarkMode={isDarkMode} />;
    default:
      return null;
  }
});
