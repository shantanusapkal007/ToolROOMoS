import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
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

