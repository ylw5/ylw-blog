import { defineConfig } from 'vitepress'
export default defineConfig({
  title: 'ylw-blog',
  titleTemplate: false,
  description: 'ylw\'s blog',
  themeConfig: {
    logo: {
      src: '/logo.svg',
      alt: 'ylw-blog',
    },
    siteTitle: false,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Blog', link: '/posts/' },
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
      light: 'github-light',
    },
  },
  head: [
    ['script', { }, `
      var changeAsideOpacity = function () {
        const aside = document.querySelector('.aside')
        if(!aside) return
        if (document.documentElement.scrollTop !== 0){
          aside.classList.add('disappear');
        }
        else {
          aside.classList.remove('disappear');
        }
      };
      function debounce(fn, delay) {
        let timer = null;
        return function () {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            fn.apply(this, arguments);
          }, delay);
        };
      }
      window.addEventListener("scroll", debounce(changeAsideOpacity,300));
    `],
  ],
})
