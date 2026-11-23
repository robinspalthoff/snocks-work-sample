import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Alle Seiten sind statisch vorgerendert; zusammen mit Partial
  // Prefetching ist die Navigation zwischen ihnen praktisch verzögerungsfrei.
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
