import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'ylw-blog',
  titleTemplate: false,
  themeConfig: {
    nav: [
      { text: 'posts', link: '/posts/' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ylw5' },
      { icon: 'twitter', link: 'https://twitter.com/ZhenMorant' },
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
