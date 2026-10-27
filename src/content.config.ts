import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const postFields = z.object({
	title: z.string(),
	date: z.coerce.date(),
	categories: z.string().optional(),
	tags: z.array(z.string()).default([]),
	lastmod: z.coerce.date().optional(),
	draft: z.boolean().default(false),
	summary: z.string().optional(),
	language: z.enum(['zh-Hant', 'en']).default('zh-Hant'),
	topics: z.array(z.enum(['Work', 'Outdoors', 'Travel', 'Life'])).default([]),
	featured: z.boolean().default(false),
	images: z.array(z.string()).default([]),
	authors: z.array(z.string()).optional(),
	layout: z.string().optional(),
	bibliography: z.string().optional(),
	canonicalUrl: z.string().optional(),
})

const blog = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
	schema: postFields,
})

const coding = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/coding' }),
	schema: postFields,
})

export const collections = { blog, coding }
