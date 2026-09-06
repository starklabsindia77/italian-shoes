// Plain-JS config on purpose: a next.config.ts would make `next start`
// load the `typescript` package at runtime, which production images do
// not ship (--omit=dev) and the sandboxed service cannot install.
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Swatch/texture sources live on S3 (and a CloudFront alias may front it
    // later). The optimizer serves ~2KB WebP thumbs instead of multi-MB
    // originals; sharp is a direct dependency so prod optimization works.
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
    ],
    formats: ["image/webp"],
    // Asset keys are uuid-versioned, so optimized copies can cache for a year.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Heavy static viewer assets (GLBs, HDRI env maps, leather swatches).
        // `immutable` means browsers never revalidate for a year — so replacing
        // one of these files requires a NEW filename, never overwriting in place.
        source: "/:prefix(models|hdri|leather)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
