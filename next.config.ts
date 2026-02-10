
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable compression for better performance
  compress: true,
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize font loading
  optimizeFonts: true,
  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'recharts',
      '@tanstack/react-query',
    ],
    // External packages for server components
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    // Enable modern image formats for better performance
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
