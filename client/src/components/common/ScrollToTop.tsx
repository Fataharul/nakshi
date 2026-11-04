import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Automatically resets the browser viewport scroll position to (0, 0)
 * whenever the user navigates between routes, preventing new pages from
 * retaining the scroll offset of the previous page. If a URL fragment / anchor
 * hash is present (e.g. #reviews), scrolls to the target element instead.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace(/^#/, ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Instantly scroll to the top of the window
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });

    // Fallback reset for root document scroll containers
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
