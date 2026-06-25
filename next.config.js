/** @type {import('next').NextConfig} */
const nextConfig = {
  // Buộc invalidate build cache của Railway
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

module.exports = nextConfig;
