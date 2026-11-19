import { useCallback, useState } from 'react';
import { getItem, setItem } from '../../../services/storage/storage';

const KEY = 'SAVED_LISTINGS';

const read = () => {
  const list = getItem(KEY, true);
  return Array.isArray(list) ? list : [];
};

/** Save / unsave a listing on this device (stored in MMKV, no account needed). */
export const useSavedListing = slug => {
  const [saved, setSaved] = useState(() => read().includes(slug));

  const toggle = useCallback(() => {
    const list = read();
    const next = list.includes(slug) ? list.filter(item => item !== slug) : [slug, ...list];
    setItem(KEY, next);
    setSaved(next.includes(slug));
  }, [slug]);

  return { saved, toggle };
};
