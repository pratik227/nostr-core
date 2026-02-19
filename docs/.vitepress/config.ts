import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'nostr-core',
  description: 'Dead simple, vendor neutral NWC client',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/nwc-logo.svg' }],
  ],

  themeConfig: {
    logo: '/nwc-logo.svg',

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/api/nwc' },
      { text: 'Agent Docs', link: '/agent' },
      { text: 'Team', link: '/team' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          {
            text: 'Getting Started',
            collapsed: true,
            items: [
              { text: 'Introduction', link: '/guide/introduction' },
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Quick Start', link: '/guide/quick-start' },
            ],
          },
          {
            text: 'Core Concepts',
            collapsed: true,
            items: [
              { text: 'Wallet Operations', link: '/guide/wallet-operations' },
              { text: 'Encryption', link: '/guide/encryption' },
              { text: 'Relays', link: '/guide/relays' },
              { text: 'Error Handling', link: '/guide/error-handling' },
            ],
          },
          {
            text: 'Resources',
            collapsed: true,
            items: [
              { text: 'Comparison', link: '/guide/comparison' },
            ],
          },
        ],
      },
      {
        text: 'API Reference',
        items: [
          {
            text: 'Client',
            collapsed: true,
            items: [
              { text: 'NWC', link: '/api/nwc' },
            ],
          },
          {
            text: 'Primitives',
            collapsed: true,
            items: [
              { text: 'Relay', link: '/api/relay' },
              { text: 'RelayPool', link: '/api/pool' },
              { text: 'Filter', link: '/api/filter' },
              { text: 'Event', link: '/api/event' },
              { text: 'Crypto', link: '/api/crypto' },
            ],
          },
          {
            text: 'NIPs',
            collapsed: true,
            items: [
              { text: 'NIP-04', link: '/api/nip04' },
              { text: 'NIP-44', link: '/api/nip44' },
              { text: 'NIP-19', link: '/api/nip19' },
            ],
          },
          {
            text: 'Utilities',
            collapsed: true,
            items: [
              { text: 'Types', link: '/api/types' },
              { text: 'Errors', link: '/api/errors' },
              { text: 'Utils', link: '/api/utils' },
            ],
          },
        ],
      },
    ],

    socialLinks: [

      { icon: 'github', link: 'https://github.com/pratik227' },
      { icon: 'x', link: 'https://x.com/PratikPatel_227' },
    ],

    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
