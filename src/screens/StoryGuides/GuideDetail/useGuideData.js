import { useMemo, useDeferredValue } from 'react';
import { resolveImageUrl, useArticleDetail } from '../../../hooks/useDiscovery';
import { parseArticleBody, dropFurtherReading } from './parser';
import { CATEGORY_THEMES } from './constants';
import { formatPublishedDate } from './format';
import { mapCategoryToBadge, CATEGORY_TABS } from '../GuidesScreen';

/** Loads the article and turns it into the view model the screen renders. */
export const useGuideData = (slug, initialGuide) => {
  const {
    data: detailResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useArticleDetail(slug);

  /* ── Extract raw article ─────────────────────────────────────────── */
  const remoteArticle = useMemo(() => {
    if (!detailResponse) return null;
    if (detailResponse.article && typeof detailResponse.article === 'object') {
      return detailResponse.article;
    }
    if (detailResponse.data?.article && typeof detailResponse.data?.article === 'object') {
      return detailResponse.data.article;
    }
    if (
      detailResponse.data &&
      typeof detailResponse.data === 'object' &&
      !Array.isArray(detailResponse.data)
    ) {
      return detailResponse.data;
    }
    return detailResponse;
  }, [detailResponse]);

  /* ── Build guide object ──────────────────────────────────────────── */
  const guide = useMemo(() => {
    const raw = remoteArticle || initialGuide;
    if (!raw) return null;

    const rawCategory = raw.category || initialGuide?.categorySlug || initialGuide?.category;
    const badge = mapCategoryToBadge(rawCategory);
    const categoryTab = CATEGORY_TABS.find(
      tab => tab.categorySlug && tab.categorySlug === String(rawCategory || '').toLowerCase(),
    );
    const accent = CATEGORY_THEMES[badge.type] || CATEGORY_THEMES.destination;

    const author =
      raw.authorName || raw.author || initialGuide?.author || 'Ekta & Akash — Travel With Tails';

    const readTime = raw.estimatedReadMinutes
      ? `${raw.estimatedReadMinutes} min read`
      : raw.readTime || initialGuide?.readTime || '8 min read';

    const imageUri = raw.coverImageUrl
      ? resolveImageUrl(raw.coverImageUrl)
      : raw.imageUri || initialGuide?.imageUri || null;

    const viewCount = raw.viewCount || initialGuide?.viewCount || null;
    const publishedDate = formatPublishedDate(
      raw.publishedAt || raw.createdAt || initialGuide?.publishedAt,
    );
    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : Array.isArray(initialGuide?.tags)
      ? initialGuide.tags
      : [];

    const excerpt = raw.excerpt || initialGuide?.excerpt || '';

    return {
      id: String(raw.id || raw.slug || slug),
      slug: raw.slug || slug,
      title: raw.title || initialGuide?.title || '',
      badgeText: badge.text || raw.badgeText || 'PET GUIDE',
      badgeType: badge.type,
      categoryIcon: categoryTab?.icon || 'paw-outline',
      accent,
      author,
      readTime,
      viewCount,
      publishedDate,
      imageUri,
      excerpt,
      tags,
    };
  }, [remoteArticle, initialGuide, slug]);

  /* ── Body: parsed once per distinct HTML, at low priority ───────────── */
  // The list-provided body is replaced by the API body when it arrives. Equal strings do not
  // re-parse, and the deferred value lets the header/hero paint before the parse + render.
  const bodySource = useMemo(() => {
    const raw = remoteArticle || initialGuide;
    if (!raw) {
      return '';
    }
    return raw.body || raw.content || raw.rawBody || initialGuide?.rawBody || '';
  }, [remoteArticle, initialGuide]);
  const deferredBody = useDeferredValue(bodySource, '');
  const bodyNodes = useMemo(
    () => dropFurtherReading(parseArticleBody(deferredBody)),
    [deferredBody],
  );

  return { guide, bodyNodes, isLoading, refetch, isRefetching };
};
