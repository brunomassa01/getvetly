/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Propostas em PDF podem ter alguns MB. Aumenta o limite do upload
      // via Server Action (padrão é 1MB).
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
