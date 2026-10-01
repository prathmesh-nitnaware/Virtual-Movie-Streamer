import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document title and meta description per route.
 * @param {string} title
 * @param {string} description
 */
export function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute('content', description);
      }
    }
  }, [title, description]);
}

export default useDocumentTitle;
