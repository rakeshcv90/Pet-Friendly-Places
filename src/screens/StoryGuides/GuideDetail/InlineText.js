import React from 'react';
import { Text } from 'react-native';
import { hasFormatting } from './parser';
import { MARK_COLORS } from './constants';
import { styles } from './styles/body';

export const InlineText = ({ text, runs, style, isDarkMode, onLinkPress }) => {
  if (!runs || !hasFormatting(runs)) {
    return <Text style={style}>{text}</Text>;
  }
  return (
    <Text style={style}>
      {runs.map((run, i) => (
        <Text
          key={i}
          style={[
            run.bold && styles.runBold,
            run.mark && [styles.runMark, { backgroundColor: MARK_COLORS[run.mark] }],
            run.href && [styles.runLink, isDarkMode && styles.runLinkDark],
          ]}
          onPress={run.href ? () => onLinkPress && onLinkPress(run.href) : undefined}>
          {run.text}
        </Text>
      ))}
    </Text>
  );
};
