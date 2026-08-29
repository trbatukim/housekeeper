import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'HouseKeeper',
    short_name: 'HouseKeeper',
    description:
      'Share groceries, expenses, laundry, and dishes with your household.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#14101F',
    theme_color: '#14101F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
