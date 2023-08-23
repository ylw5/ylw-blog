import { createContentLoader } from 'vitepress'

interface Post {
  url: string
  title: string
  date: {
    time: number
    string: string
  }
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw.filter((data) => {
      return data.frontmatter.date
    }).map(({ url, frontmatter }) => {
      return {
        url,
        title: frontmatter.title,
        date: formatDate(frontmatter.date),
      }
    }).sort((a, b) => b.date.time - a.date.time)
  },
})

function formatDate(raw: string): Post['date'] {
  const date = new Date(raw)
  date.setUTCHours(12)
  return {
    time: +date,
    string: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }
}
