/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    // Use remotePatterns (recommended) to whitelist external image hosts
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
    ],
  },

  // Redirect old Cyrillic routes to ASCII equivalents to avoid 404s
  async redirects() {
    return [
      { source: '/вход', destination: '/login', permanent: false },
      { source: '/регистрация', destination: '/register', permanent: false },
    ]
  },
}
