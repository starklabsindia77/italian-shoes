// Plain-JS config on purpose: a next.config.ts would make `next start`
// load the `typescript` package at runtime, which production images do
// not ship (--omit=dev) and the sandboxed service cannot install.
/** @type {import('next').NextConfig} */
const nextConfig = {
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
