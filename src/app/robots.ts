import type { MetadataRoute } from "next";

/** Arbeitsprobe: ausdrücklich nicht für Suchmaschinen. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
