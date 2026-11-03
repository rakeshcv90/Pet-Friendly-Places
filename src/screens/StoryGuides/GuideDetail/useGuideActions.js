import { useCallback } from 'react';
import { Share, Linking } from 'react-native';
import { WEB_ORIGIN } from './constants';

/** Share, back, deep-link and "open guide hub" handlers for the guide page. */
export const useGuideActions = (navigation, guide) => {
  const handleShareGuide = useCallback(async () => {
    if (!guide) return;
    try {
      await Share.share({
        message: `🐾 Check out this pet guide on PetFriendly: "${guide.title}"\n\n${guide.excerpt || ''}`,
        title: guide.title,
      });
    } catch {
      // user cancelled
    }
  }, [guide]);

  const handleOpenGuideHub = useCallback(
    tab => {
      const params = { initialTab: tab, tabRequest: Date.now() };
      // go back to the existing Story Guides screen if it is in the stack, otherwise open it
      if (navigation?.popTo) {
        navigation.popTo('StoryGuidesScreen', params);
      } else {
        navigation?.navigate?.('StoryGuidesScreen', params);
      }
    },
    [navigation],
  );

  const handleLinkPress = useCallback(
    href => {
      if (!href) {
        return;
      }
      const guideMatch = href.match(/^\/guides\/([^/?#]+)/);
      if (guideMatch && navigation?.push) {
        navigation.push('GuideDetailScreen', { slug: guideMatch[1] });
        return;
      }
      const placeMatch = href.match(/^\/places\/([^/?#]+)/);
      if (placeMatch && navigation?.navigate) {
        navigation.navigate('ListingDetailScreen', { slug: placeMatch[1] });
        return;
      }
      const url = /^(https?:|tel:|mailto:)/i.test(href)
        ? href
        : `${WEB_ORIGIN}${href.startsWith('/') ? href : `/${href}`}`;
      Linking.openURL(url).catch(() => {});
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    if (navigation?.goBack) navigation.goBack();
  }, [navigation]);

  return { handleShareGuide, handleOpenGuideHub, handleLinkPress, handleBack };
};
