import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['leaflet', 'leaflet.markercluster'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gbif.org',
      },
      {
        protocol: 'https',
        hostname: 'api.gbif.org',
      },
      {
        protocol: 'https',
        hostname: 'www.antweb.org',
      },
      {
        protocol: 'https',
        hostname: 'inaturalist-open-data.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'static.inaturalist.org',
      },
      {
        protocol: 'https',
        hostname: 'observation.org',
      },
      {
        protocol: 'https',
        hostname: '**.observation.org',
      }
    ],
  },
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
