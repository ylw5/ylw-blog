import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'ylw-blog',
  titleTemplate: false,
  themeConfig: {
    logo: {
      src: '/logo.svg',
      alt: 'ylw-blog',
    },
    siteTitle: false,
    nav: [
      { text: 'posts', link: '/posts/' },
      { text: 'project', link: '/' },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ylw5' },
      { icon: 'twitter', link: 'https://twitter.com/ZhenMorant' },
    ],
    footer: {
      copyright: '© 2022-present Lingwei Ye',
    },
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
