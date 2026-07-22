/** @type {import('next').NextConfig} */
const nextConfig = {
  // No frenar el build por reglas de estilo de ESLint (igual avisan en dev).
  eslint: { ignoreDuringBuilds: true },

  // Permite compilar en otra carpeta (BUILD_DIR) para no pisar la del servidor
  // de desarrollo, que usa `.next`. En Vercel la variable no existe y usa `.next`.
  distDir: process.env.BUILD_DIR || '.next',
};

export default nextConfig;
