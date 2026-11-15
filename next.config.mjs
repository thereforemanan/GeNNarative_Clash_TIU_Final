/** @type {import('next').NextConfig} */
const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  ...(allowedDevOrigins.length ? { allowedDevOrigins } : {}),
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
