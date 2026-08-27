import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ToolRoomOS Enterprise Manufacturing OS',
    short_name: 'ToolRoomOS',
    description: 'Enterprise Manufacturing, Toolroom Digital Twin, Engineering, and Production System',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0b0c0e',
    theme_color: '#0b0c0e',
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    categories: ['business', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Projects & Tooling',
        short_name: 'Projects',
        description: 'View active tooling projects and assembly schedules',
        url: '/projects',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Production & Shop Floor',
        short_name: 'Production',
        description: 'Live machine shop reports and job card execution',
        url: '/production',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Procurement & POs',
        short_name: 'Procurement',
        description: 'Purchase requisitions and vendor purchase orders',
        url: '/purchase-requisitions',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Maintenance Tickets',
        short_name: 'Maintenance',
        description: 'Machine breakdown and maintenance ticketing',
        url: '/maintenance',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
