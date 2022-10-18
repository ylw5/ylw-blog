import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'ylw-blog',
  themeConfig: {
    nav: [
      { text: 'posts', link: '/posts' },
    ],
  },
  lastUpdated: true,
  cleanUrls: 'with-subfolders',
  markdown: {
    theme: {
      dark: 'vitesse-dark',
      light: 'vitesse-light',
    },
  },
})
