import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Linking, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { ErrorState } from '../Community/LoadingStates';
import { theme } from '../../theme';
import { useStore } from '../../store';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';
const PINK = '#FF4FB8';

// The WebView is a native module. It is loaded lazily so that an app build that does not include it
// yet still starts, and this screen falls back to the system browser instead of crashing.
const loadWebView = () => {
  try {
    return require('react-native-webview').WebView;
  } catch (e) {
    return null;
  }
};

class WebViewBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Script that hides page elements by CSS selector. It runs before the page renders (no flash) and
// again after load, and does nothing if the rule is already there.
const buildHideScript = selectors => {
  if (!selectors || selectors.length === 0) {
    return undefined;
  }
  const css = `${selectors.join(',')}{display:none !important}`;
  return `(function(){
  if (document.querySelector('style[data-app-hide]')) { return; }
  var style = document.createElement('style');
  style.setAttribute('data-app-hide', '1');
  style.textContent = ${JSON.stringify(css)};
  (document.head || document.documentElement).appendChild(style);
})();
true;`;
};

const hostOf = url => {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url || '');
  return match ? match[1].replace(/^www\./, '') : '';
};

// Opens a web page inside the app, with a title bar, load progress, reload and open-in-browser
export const InAppBrowserScreen = ({ navigation, route }) => {
  const { url, title: routeTitle, hideSelectors } = route?.params || {};
  const hideScript = buildHideScript(hideSelectors);
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const webRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  const WebView = loadWebView();

  const openExternally = () => Linking.openURL(url).catch(() => {});

  const handleBack = () => {
    if (canGoBack && webRef.current) {
      webRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleReload = () => {
    setFailed(false);
    setLoading(true);
    webRef.current?.reload();
  };

  const animateTo = value =>
    Animated.timing(progress, { toValue: value, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();

  const renderFallback = () => (
    <View style={styles.fallback}>
      <Text style={styles.fallbackEmoji}>🌐</Text>
      <Text style={[styles.fallbackTitle, isDarkMode && styles.textLight]}>Open this page in your browser</Text>
      <Text style={[styles.fallbackText, isDarkMode && styles.textMutedDark]}>
        The in-app viewer is not available in this version of the app.
      </Text>
      <BouncyPressable activeScale={0.95} onPress={openExternally} style={styles.openBtnWrap}>
        <LinearGradient colors={[PURPLE, PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.openBtn}>
          <Feather name="external-link" size={ms(14)} color="#FFFFFF" />
          <Text style={styles.openBtnText}>Open in browser</Text>
        </LinearGradient>
      </BouncyPressable>
    </View>
  );

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} translucent={false} />

      <LinearGradient
        colors={[DEEP_PURPLE, PURPLE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, s(12)) + s(6) }]}>
        <BouncyPressable
          activeScale={0.88}
          accessibilityLabel={canGoBack ? 'Back' : 'Close'}
          onPress={handleBack}
          style={styles.iconBtn}>
          <Feather name={canGoBack ? 'chevron-left' : 'x'} size={ms(18)} color="#FFFFFF" />
        </BouncyPressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {routeTitle || pageTitle || 'Web page'}
          </Text>
          <View style={styles.hostRow}>
            <Feather name="lock" size={ms(9)} color="rgba(255,255,255,0.7)" />
            <Text style={styles.host} numberOfLines={1}>
              {hostOf(url)}
            </Text>
          </View>
        </View>

        <BouncyPressable activeScale={0.88} accessibilityLabel="Reload" onPress={handleReload} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={ms(15)} color="#FFFFFF" />
        </BouncyPressable>
        <BouncyPressable
          activeScale={0.88}
          accessibilityLabel="Open in browser"
          onPress={openExternally}
          style={styles.iconBtn}>
          <Feather name="external-link" size={ms(15)} color="#FFFFFF" />
        </BouncyPressable>
      </LinearGradient>

      <View style={styles.progressTrack}>
        {loading && (
          <Animated.View style={[styles.progressFill, { width: barWidth }]}>
            <LinearGradient colors={[PINK, '#FF9F1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
      </View>

      <View style={styles.flex}>
        {!url ? (
          renderFallback()
        ) : !WebView ? (
          renderFallback()
        ) : failed ? (
          <ErrorState message="Could not load this page" onRetry={handleReload} isDarkMode={isDarkMode} />
        ) : (
          <WebViewBoundary fallback={renderFallback()}>
            <WebView
              ref={webRef}
              source={{ uri: url }}
              style={[styles.web, isDarkMode && styles.webDark]}
              startInLoadingState={false}
              setSupportMultipleWindows={false}
              injectedJavaScriptBeforeContentLoaded={hideScript}
              injectedJavaScript={hideScript}
              onLoadStart={() => {
                setLoading(true);
                setFailed(false);
                progress.setValue(0);
              }}
              onLoadProgress={({ nativeEvent }) => animateTo(nativeEvent.progress)}
              onLoadEnd={() => {
                animateTo(1);
                setTimeout(() => setLoading(false), 220);
              }}
              onError={() => setFailed(true)}
              onHttpError={({ nativeEvent }) => nativeEvent.statusCode >= 500 && setFailed(true)}
              onNavigationStateChange={state => {
                setCanGoBack(state.canGoBack);
                if (state.title) {
                  setPageTitle(state.title);
                }
              }}
            />
          </WebViewBoundary>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },

  header: { flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: s(12), paddingBottom: s(10) },
  iconBtn: { width: s(34), height: s(34), borderRadius: s(17), backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, paddingHorizontal: s(4) },
  title: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(14), color: '#FFFFFF' },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(1) },
  host: { flexShrink: 1, fontFamily: theme.typography.fontFamily.medium, fontSize: s(10), color: 'rgba(255,255,255,0.7)' },

  progressTrack: { height: s(3), backgroundColor: 'rgba(123,44,255,0.12)' },
  progressFill: { height: '100%', overflow: 'hidden' },

  web: { flex: 1, backgroundColor: '#FFFFFF' },
  webDark: { backgroundColor: '#0F071D' },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(30), gap: s(6) },
  fallbackEmoji: { fontSize: s(40), marginBottom: s(4) },
  fallbackTitle: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(15), color: DEEP_PURPLE, textAlign: 'center' },
  fallbackText: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(12), lineHeight: s(18), color: '#6B7280', textAlign: 'center', marginBottom: s(10) },
  openBtnWrap: { borderRadius: s(22), shadowColor: PINK, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: s(8), borderRadius: s(22), paddingVertical: s(11), paddingHorizontal: s(22) },
  openBtnText: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(13), color: '#FFFFFF' },
});
