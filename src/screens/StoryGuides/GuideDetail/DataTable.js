import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ms } from 'react-native-size-matters';
import { InlineText } from './InlineText';
import { styles } from './styles/table';

const TONES = {
  yes: { bg: '#DCFCE7', fg: '#166534', dot: '#22C55E', bgDark: 'rgba(34,197,94,0.16)', fgDark: '#86EFAC' },
  maybe: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B', bgDark: 'rgba(245,158,11,0.16)', fgDark: '#FCD34D' },
  no: { bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444', bgDark: 'rgba(239,68,68,0.16)', fgDark: '#FCA5A5' },
};

// "YES - core" -> green, "Optional" / "If boarding..." -> amber, "No" -> red
const toneOf = text => {
  const v = (text || '').trim().toLowerCase();
  if (/^(yes|required|mandatory)\b/.test(v)) {
    return 'yes';
  }
  if (/^(no|not required|never)\b/.test(v)) {
    return 'no';
  }
  if (/^(optional|if|recommended|sometimes|maybe)\b/.test(v)) {
    return 'maybe';
  }
  return null;
};

// Column width from the longest cell, so short columns stay compact and long ones wrap
const columnWidth = chars => Math.min(Math.max(chars * ms(7) + ms(36), ms(96)), ms(220));

const StatusChip = ({ text, tone, isDarkMode }) => {
  const c = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: isDarkMode ? c.bgDark : c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: isDarkMode ? c.fgDark : c.fg }]}>{text}</Text>
    </View>
  );
};

/** Scrollable data table: gradient header, bold first column, status values as coloured pills. */
export const DataTable = ({ header, rows, isDarkMode, onLinkPress }) => {
  const [viewW, setViewW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const columnCount = Math.max(header ? header.length : 0, ...rows.map(row => row.length));

  // a column is a "status" column when its header says so or most of its cells read like one
  const statusCols = useMemo(() => {
    const cols = new Set();
    for (let col = 0; col < columnCount; col++) {
      const tones = rows.map(row => toneOf(row[col] && row[col].text)).filter(Boolean).length;
      const headerHit = header && header[col] && /required|status|mandatory/i.test(header[col].text);
      if (rows.length && (tones / rows.length >= 0.7 || (headerHit && tones / rows.length >= 0.5))) {
        cols.add(col);
      }
    }
    return cols;
  }, [header, rows, columnCount]);

  const baseWidths = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, col) => {
        const cells = [header && header[col], ...rows.map(row => row[col])].filter(Boolean);
        return columnWidth(Math.max(...cells.map(cell => cell.text.length), 0));
      }),
    [header, rows, columnCount],
  );
  // a table narrower than the card stretches to fill it
  const total = baseWidths.reduce((sum, w) => sum + w, 0);
  const scale = viewW > total ? viewW / total : 1;
  const widths = baseWidths.map(w => w * scale);

  const overflowing = contentW > viewW + 1;
  const onScroll = useCallback(
    e => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const end = contentOffset.x + layoutMeasurement.width >= contentSize.width - 4;
      setAtEnd(prev => (prev === end ? prev : end));
    },
    [],
  );

  const renderCell = (cell, col, rowIndex) => {
    let content = null;
    if (cell) {
      if (statusCols.has(col) && toneOf(cell.text)) {
        content = <StatusChip text={cell.text} tone={toneOf(cell.text)} isDarkMode={isDarkMode} />;
      } else {
        content = (
          <InlineText
            text={cell.text}
            runs={cell.runs}
            isDarkMode={isDarkMode}
            onLinkPress={onLinkPress}
            style={[
              styles.cellText,
              isDarkMode && styles.cellTextDark,
              col === 0 && styles.firstCellText,
              col === 0 && isDarkMode && styles.firstCellTextDark,
            ]}
          />
        );
      }
    }
    return (
      <View key={`${rowIndex}-${col}`} style={[styles.cell, { width: widths[col] }]}>
        {content}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.shell, isDarkMode && styles.shellDark]}>
        <View style={styles.clip}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={onScroll}
            onLayout={e => setViewW(e.nativeEvent.layout.width)}
            onContentSizeChange={w => setContentW(w)}>
            <View>
              {header ? (
                <LinearGradient
                  colors={['#3B108F', '#7B2CFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.headRow}>
                  {Array.from({ length: columnCount }, (_, col) => (
                    <View key={col} style={[styles.headCell, { width: widths[col] }]}>
                      {header[col] ? <Text style={styles.headText}>{header[col].text}</Text> : null}
                    </View>
                  ))}
                </LinearGradient>
              ) : null}
              {rows.map((row, i) => (
                <View
                  key={i}
                  style={[
                    styles.row,
                    isDarkMode && styles.rowDark,
                    i % 2 === 1 && (isDarkMode ? styles.rowAltDark : styles.rowAlt),
                    i === rows.length - 1 && styles.rowLast,
                  ]}>
                  {Array.from({ length: columnCount }, (_, col) => renderCell(row[col], col, i))}
                </View>
              ))}
            </View>
          </ScrollView>

          {overflowing && !atEnd ? (
            <LinearGradient
              colors={isDarkMode ? ['rgba(22,13,46,0)', '#160D2E'] : ['rgba(255,255,255,0)', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fade}
              pointerEvents="none"
            />
          ) : null}
        </View>
      </View>
      {overflowing && !atEnd ? (
        <Text style={[styles.hint, isDarkMode && styles.hintDark]}>Swipe to see all columns →</Text>
      ) : null}
    </>
  );
};
