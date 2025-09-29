/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Разрешаем изображения с внешних доменов
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      // Добавляем поддержку для любых https доменов (для демо)
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    // Альтернативно, можно использовать domains (устаревший способ)
    // domains: ['cdn.example.com', 'example.com'],
  },
}

module.exports = nextConfig
