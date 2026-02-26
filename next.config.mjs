/** @type {import('next').NextConfig} */
const extraAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const nextConfig = {
  reactStrictMode: true,
  // Allow LAN/mobile device access during `next dev` (Next.js warns for non-localhost origins).
  // Add more origins via env: NEXT_ALLOWED_DEV_ORIGINS=10.136.134.53,192.168.1.10
  allowedDevOrigins: Array.from(new Set(["10.136.134.53", ...extraAllowedDevOrigins]))
};

export default nextConfig;
