import React from 'react';
import { View } from 'react-native';
import { BodyNode } from './BodyNode';
import { Reveal } from './Reveal';
import { styles } from './styles/body';

/** Article body: every block rises into place as it scrolls into view. */
export const GuideBody = ({
  nodes,
  scrollY,
  viewportH,
  bodyTop,
  onLayout,
  isDarkMode,
  onLinkPress,
}) => (
  <View style={styles.bodyContainer} onLayout={onLayout}>
    {nodes.map((node, idx) => (
      <Reveal key={idx} scrollY={scrollY} viewportH={viewportH} bodyTop={bodyTop}>
        <BodyNode node={node} isDarkMode={isDarkMode} onLinkPress={onLinkPress} />
      </Reveal>
    ))}
  </View>
);
