import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { parseArticleBody } from '../GuideDetail/parser';
import { BodyNode } from '../GuideDetail/BodyNode';
import { SectionCard, Pill } from './SectionCard';
import { styles } from './styles';

/** "Why pet parents will love this place": the full description, then the tags. */
export const ListingAbout = ({ listing, palette, isDarkMode, onLinkPress }) => {
  const nodes = useMemo(() => parseArticleBody(listing.descriptionHtml), [listing.descriptionHtml]);

  if (!nodes.length && !listing.excerpt) {
    return null;
  }

  return (
    <SectionCard
      title="Why pet parents will love this place"
      icon="heart-outline"
      palette={palette}
      isDarkMode={isDarkMode}>
      {nodes.length ? (
        nodes.map((node, i) => (
          <BodyNode key={i} node={node} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />
        ))
      ) : (
        <Text style={[styles.bodyText, { color: palette.body }]}>{listing.excerpt}</Text>
      )}
      {listing.tags.length ? (
        <View style={[styles.chipsWrap, styles.gapTop]}>
          {listing.tags.slice(0, 10).map(tag => (
            <Pill key={tag} label={tag} background={palette.soft} color={palette.accent} />
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
};
