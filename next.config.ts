import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcryptjs', 'bcrypt'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: [
        'localhost:3000',
        '*.vercel.app',
        '*.up.railway.app',
        '*.railway.app',
      ],
    },
    optimizePackageImports: ['recharts', 'lucide-react', 'date-fns', 'framer-motion', 'exceljs'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
