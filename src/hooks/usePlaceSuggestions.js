import { useEffect, useRef, useState } from 'react';
import { MIN_SUGGEST_LENGTH, fetchLocationSuggestions } from '../services/urbania/urbaniaApi';

export const SUGGEST_DELAY_MS = 300;

// Place suggestions for a text box, while `active` (the box is being typed in).
//  - waits for a short pause in typing, so it does not ask Google on every letter
//  - drops an answer that arrives after the text has moved on
//  - after a place is picked (`choose`), the picked text does not trigger another search
export const usePlaceSuggestions = (text, active) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const picked = useRef(null);

  useEffect(() => {
    const value = String(text || '').trim();
    if (!active || value.length < MIN_SUGGEST_LENGTH || picked.current === value) {
      setItems([]);
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      const result = await fetchLocationSuggestions(value, { signal: controller.signal });
      if (current) {
        setItems(result);
        setLoading(false);
      }
    }, SUGGEST_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, active]);

  // Call with the chosen suggestion's text: closes the list
  const choose = description => {
    picked.current = String(description || '').trim();
    setItems([]);
    setLoading(false);
  };

  return { items, loading, choose };
};
