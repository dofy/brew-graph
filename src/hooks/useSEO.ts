import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "Brew Graph - Homebrew Package Explorer";
const DEFAULT_DESCRIPTION =
  "Search, explore and manage Homebrew packages. Browse formulae and casks, view dependencies, and organize your favorites with tags.";

export function useSEO({ title, description }: SEOProps = {}) {
  useEffect(() => {
    // Update title
    const fullTitle = title ? `${title} - Brew Graph` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        description || DEFAULT_DESCRIPTION
      );
    }

    // Update OG title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    // Update OG description
    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription) {
      ogDescription.setAttribute(
        "content",
        description || DEFAULT_DESCRIPTION
      );
    }

    // Update Twitter title
    const twitterTitle = document.querySelector(
      'meta[property="twitter:title"]'
    );
    if (twitterTitle) {
      twitterTitle.setAttribute("content", fullTitle);
    }

    // Update Twitter description
    const twitterDescription = document.querySelector(
      'meta[property="twitter:description"]'
    );
    if (twitterDescription) {
      twitterDescription.setAttribute(
        "content",
        description || DEFAULT_DESCRIPTION
      );
    }

    // Cleanup: reset to defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
      if (metaDescription) {
        metaDescription.setAttribute("content", DEFAULT_DESCRIPTION);
      }
      if (ogTitle) {
        ogTitle.setAttribute("content", DEFAULT_TITLE);
      }
      if (ogDescription) {
        ogDescription.setAttribute("content", DEFAULT_DESCRIPTION);
      }
      if (twitterTitle) {
        twitterTitle.setAttribute("content", DEFAULT_TITLE);
      }
      if (twitterDescription) {
        twitterDescription.setAttribute("content", DEFAULT_DESCRIPTION);
      }
    };
  }, [title, description]);
}
