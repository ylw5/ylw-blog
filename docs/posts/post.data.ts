import fg from 'fast-glob'
import matter from 'gray-matter'
interface Time {
  year: number
  month: number | string
  day: number
}
interface Post {
  link: string
  title: string
  description?: string
  time: Time
}

export async function getPosts() {
  const files = await fg(['docs/posts/*.md', 'docs/posts/**/*.md', '!docs/posts/index.md'])
  const posts
  = files
    .map((file) => {
      const { data } = matter.read(file)
      return {
        title: data.title,
        time: data.time,
        link: file.replace('docs', '').replace('.md', ''),
        description: data.description,
      }
    })
    .sort((a, b) => b.time?.getTime() - a.time?.getTime())
    .map(post => (
      {
        ...post,
        time: {
          year: post.time.getFullYear(),
          month: formatMonth(post.time.getMonth()),
          day: post.time.getDate(),
        },
      }
    )) as Post[]

  return posts
}
export declare const data: Post[]
export default {
  watch: ['./*.md', './**/*.md'],
  async load() {
    return await getPosts()
  },
}

function formatDate(dateObj: Date) {
  // const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const dateOrdinal = (dom: number) => {
    if (dom === 31 || dom === 21 || dom === 1)
      return `${dom}st`
    else if (dom === 22 || dom === 2)
      return `${dom}nd`
    else if (dom === 23 || dom === 3)
      return `${dom}rd`
    else return `${dom}th`
  }
  return `${dateOrdinal(dateObj.getDate())}, ${months[dateObj.getMonth()]}, ${dateObj.getFullYear()}`
}
function formatMonth(month: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  return months[month]
}

