import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { metaFor } from '../data/articleMeta'

/** @param {import('astro').APIContext} context */
export async function GET(context) {
	const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
	return rss({
		title: 'Dylan Lin',
		description: 'Writing about travel, outdoor life, books, and the choices around them.',
		site: context.site,
		items: posts.map((post) => ({ title: post.data.title, description: metaFor(post.id).summary, pubDate: post.data.date, link: `/blog/${post.id}/` })),
	})
}
