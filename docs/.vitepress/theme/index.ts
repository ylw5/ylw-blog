import DefaultTheme from 'vitepress/theme'
import './override.css'
import { nextTick, watch } from 'vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    const changeAsideOpacity = function () {
      const aside = document.querySelector('.aside') as HTMLElement
      if (document.documentElement.scrollTop !== 0)
        aside.classList.add('disappear')
      else
        aside.classList.remove('disappear')
    }

    watch(router.route, () => {
      const path = router.route.path
      let hasScroll = false
      if (path.startsWith('/posts/') && path !== '/posts/') {
        nextTick(() => {
          document.addEventListener('scroll', changeAsideOpacity)
          hasScroll = true
        })
      }
      else if (hasScroll) {
        document.removeEventListener('scroll', changeAsideOpacity)
      }
    })
  },

}
