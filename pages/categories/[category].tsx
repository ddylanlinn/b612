import { TagSEO } from '@/components/SEO'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayout'
import { allCoreContent } from 'pliny/utils/contentlayer'
import { InferGetStaticPropsType } from 'next'
import { allBlogs, allCodings } from 'contentlayer/generated'


export async function getStaticPaths() {
  const blogs = allBlogs
  const coding = allCodings
  const posts = [...blogs, ...coding].filter((post) => post.draft !== true)
  return {
    paths: posts.map((post) => ({
      params: {
        category: post?.categories || '1',
      },
    })),
    fallback: false,
  }
}

export const getStaticProps = async (context) => {
  const categories = context.params.category as string
  const blogs = allBlogs
  const coding = allCodings
  const posts = [...blogs, ...coding]
  const filteredPosts = allCoreContent(
    posts.filter(
      (post) => post.draft !== true && post.categories === categories
    )
  )

  return { props: { posts: filteredPosts, categories } }
}

export default function Category({ posts, categories }: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!posts) return
  return (
    <>
      <TagSEO
        title={`${categories} - ${siteMetadata.title}`}
        description={`${categories} categories - ${siteMetadata.author}`}
      />
      <ListLayout posts={posts} title={`${categories?.toUpperCase()}`} />
    </>
  )
}
