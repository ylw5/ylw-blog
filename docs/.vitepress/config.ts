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
      {
        text: 'Booknote',
        items: [
          { text: 'Vue.js设计与实现', link: '/booknote/vue3design/' },
          { text: '浏览器工作原理与实践', link: '/booknote/libing/' },
        ],
      },
    ],
    sidebar: {
      '/booknote/vue3design': [
        {
          text: 'Vue.js 设计与实现',
          items: [
            { text: '响应系统', link: '/booknote/vue3design/reactivity' },
            { text: '渲染器', link: '/booknote/vue3design/renderer' },
            { text: 'Diff 算法', link: '/booknote/vue3design/diff-algorithm' },
            { text: '组件化', link: '/booknote/vue3design/component' },
            { text: '编译器', link: '/booknote/vue3design/compiler' },
          ],
        },
      ],
      '/booknote/libing': [
        {
          text: '浏览器工作原理与实践',
          items: [
            { text: '宏观视角下的浏览器', link: '/booknote/libing/browser-in-macro-view' },
            { text: '浏览器中的 JavaScript 执行机制', link: '/booknote/libing/js-execution-machanism' },
            { text: '浏览器中的页面循环系统', link: '/booknote/libing/page-loop-system' },
            { text: '浏览器中的页面', link: '/booknote/libing/page-in-browser' },
            { text: '浏览器中的网络', link: '/booknote/libing/internet' },
            { text: '浏览器安全', link: '/booknote/libing/secure' },
          ],
        },
      ],
    },
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
