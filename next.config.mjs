/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration is now active during builds
  // eslint: {
  //   // We want ESLint to run during builds
  //   ignoreDuringBuilds: false, // Default is false, explicitly setting for clarity or if you had other ESLint configs
  // },

  // TypeScript configuration is now active during builds
  // typescript: {
  //   // We want TypeScript errors to fail the build
  //   ignoreBuildErrors: false, // Default is false, explicitly setting for clarity or if you had other TS configs
  // },

  images: {
    unoptimized: true,
  },

  // Add other Next.js configurations here as needed
};

export default nextConfig;