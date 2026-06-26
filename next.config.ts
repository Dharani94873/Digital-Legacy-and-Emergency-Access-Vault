import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control',     value: 'on' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.cloudinary.com https://amoy.polygonscan.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ── Image domains
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // ── Server-only packages — prevent webpack from bundling Node.js-only modules on the client
  serverExternalPackages: ['mongoose', 'bcryptjs', 'ethers', 'cloudinary'],

  // ── Webpack config
  webpack(config, { isServer }) {
    if (!isServer) {
      // Browser build: stub out Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:      false,
        net:     false,
        tls:     false,
        crypto:  false,
        stream:  false,
        path:    false,
        os:      false,
        http:    false,
        https:   false,
        zlib:    false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
