/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma 7.x usa node: scheme internamente (node:crypto, node:fs, etc.)
    // O webpack do Next.js 14 não suporta esse scheme por padrão.
    // serverComponentsExternalPackages exclui esses módulos do bundle webpack,
    // mantendo-os como dependências externas resolvidas em runtime pelo Node.js.
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@prisma/adapter-mariadb",
      "mariadb",
      "bcryptjs",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Permite que o webpack resolva módulos com o scheme node: (ex: node:crypto, node:path)
      // necessário para o Prisma 7.x que gera código com imports node: explícitos.
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push(({ request }, callback) => {
          if (request && request.startsWith('node:')) {
            return callback(null, 'commonjs ' + request.slice(5))
          }
          callback()
        })
      }
    }
    return config
  },
};

export default nextConfig;
