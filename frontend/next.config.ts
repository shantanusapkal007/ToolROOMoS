import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendUrl = process.env.INTERNAL_BACKEND_URL || process.env.BACKEND_URL || 'http://backend:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      'framer-motion',
      'clsx',
      'tailwind-merge',
      'papaparse',
      'xlsx',
      'exceljs',
      '@xyflow/react',
      '@visx/visx',
    ],
  },
};

export default nextConfig;

