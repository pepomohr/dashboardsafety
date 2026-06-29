/** @type {import('next').NextConfig} */
const nextConfig = {
  // Maqueta: no frenar el build por reglas de estilo de ESLint (igual avisan en dev).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
