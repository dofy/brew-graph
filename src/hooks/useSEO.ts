import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  type?: "website" | "article" | "product";
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = "https://brew-graph.vercel.app";
const DEFAULT_TITLE = "Brew Graph - Homebrew Package Explorer";
const DEFAULT_DESCRIPTION =
  "Search, explore and manage Homebrew packages. Browse formulae and casks, view dependencies, and organize your favorites with tags.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function useSEO({
  title,
  description,
  type = "website",
  image,
  jsonLd,
}: SEOProps = {}) {
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} - Brew Graph` : DEFAULT_TITLE;
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${BASE_URL}${location.pathname}`;
    const ogImage = image || DEFAULT_IMAGE;

    // Update title
    document.title = fullTitle;

    // Update canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", fullDescription);
    }

    // Update OG meta tags
    const ogMeta: Record<string, string> = {
      "og:title": fullTitle,
      "og:description": fullDescription,
      "og:url": canonicalUrl,
      "og:type": type,
      "og:image": ogImage,
    };

    Object.entries(ogMeta).forEach(([property, content]) => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    });

    // Update Twitter meta tags
    const twitterMeta: Record<string, string> = {
      "twitter:title": fullTitle,
      "twitter:description": fullDescription,
      "twitter:url": canonicalUrl,
      "twitter:image": ogImage,
    };

    Object.entries(twitterMeta).forEach(([name, content]) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    });

    // Update JSON-LD structured data
    let jsonLdScript = document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.setAttribute("type", "application/ld+json");
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    }

    // Cleanup: reset to defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
      if (canonicalLink) {
        canonicalLink.href = BASE_URL;
      }
      if (metaDescription) {
        metaDescription.setAttribute("content", DEFAULT_DESCRIPTION);
      }

      Object.keys(ogMeta).forEach((property) => {
        const meta = document.querySelector(`meta[property="${property}"]`);
        if (meta) {
          if (property === "og:title") meta.setAttribute("content", DEFAULT_TITLE);
          if (property === "og:description")
            meta.setAttribute("content", DEFAULT_DESCRIPTION);
          if (property === "og:url") meta.setAttribute("content", BASE_URL);
          if (property === "og:type") meta.setAttribute("content", "website");
          if (property === "og:image") meta.setAttribute("content", DEFAULT_IMAGE);
        }
      });

      Object.keys(twitterMeta).forEach((name) => {
        const meta = document.querySelector(`meta[name="${name}"]`);
        if (meta) {
          if (name === "twitter:title") meta.setAttribute("content", DEFAULT_TITLE);
          if (name === "twitter:description")
            meta.setAttribute("content", DEFAULT_DESCRIPTION);
          if (name === "twitter:url") meta.setAttribute("content", BASE_URL);
          if (name === "twitter:image")
            meta.setAttribute("content", DEFAULT_IMAGE);
        }
      });
    };
  }, [title, description, type, image, jsonLd, location.pathname]);
}

// Helper to generate package JSON-LD
export function generatePackageJsonLd(pkg: {
  name: string;
  type: "formula" | "cask";
  desc?: string | null;
  homepage?: string;
  version?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: pkg.name,
    description: pkg.desc || `${pkg.name} - Homebrew ${pkg.type}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS",
    softwareVersion: pkg.version,
    url: pkg.homepage,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
