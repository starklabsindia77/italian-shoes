// Plain-JS config on purpose: a next.config.ts would make `next start`
// load the `typescript` package at runtime, which production images do
// not ship (--omit=dev) and the sandboxed service cannot install.
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
