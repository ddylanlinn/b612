import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import { sortedBlogPost, allCoreContent } from 'pliny/utils/contentlayer'
import { InferGetStaticPropsType } from 'next'
import { NewsletterForm } from 'pliny/ui/NewsletterForm'
import { allBlogs, allCodings } from 'contentlayer/generated'
import Image from '@/components/Image'
import Card from '@/components/Card'
import type { Blog, Coding } from 'contentlayer/generated'

const MAX_DISPLAY = 27

export const getStaticProps = async () => {
  const sortedBlogs = sortedBlogPost(allBlogs.filter((post) => post.draft !== true)) as Blog[]
  const sortedCoding = sortedBlogPost(allCodings.filter((post) => post.draft !== true)) as Coding[]
  const unSortedPosts = [...sortedBlogs, ...sortedCoding]
  const posts = allCoreContent(unSortedPosts)

  return { props: { posts} }
}

export default function Home({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
      <div className='divide-y divide-gray-200 dark:divide-gray-700'>
        <div className='space-y-2 pb-8 md:space-y-5'>
          <Link
            href={`https://www.books.com.tw/products/0010880847?sloc=main`}
            aria-label={`Link to books.com`}
          >
            <Image
              alt={'camino-banner'}
              src={'/static/images/camino-banner.jpg'}
              className='rounded object-cover object-center'
              width={2048}
              height={960}
            />
          </Link>
        </div>
        <div className='divide-y divide-gray-200 dark:divide-gray-700'>
          {!posts.length && 'No posts found.'}

          <div className='container py-12'>
            <div className='-m-4 flex flex-wrap justify-between'>
              {posts.slice(0, MAX_DISPLAY).map((post) => (
                <Card
                  key={post.slug}
                  title={post.title}
                  description={post.summary}
                  imgSrc={post.images?.[0]}
                  href={post.slug}
                  date={post.date}
                  type={post.type}
                  categories={post.categories}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className='flex justify-end text-base font-medium leading-6'>
          <Link
            href='/blog'
            className='text-primary-500 hover:text-primary-600 dark:hover:text-primary-400'
            aria-label='All posts'
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
      {/* {siteMetadata.newsletter.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )} */}
    </>
  )
}
