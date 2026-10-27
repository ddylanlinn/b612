// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
	site: 'https://www.b612isreal.com',
	integrations: [
		mdx(),
		sitemap({
			filter: (page) =>
				!page.includes('/coding/') &&
					!page.includes('/bookshelf') &&
				!['/blog/', '/coding/', '/projects/', '/tags/', '/categories/'].some((path) => page.endsWith(path)),
		}),
	],
	vite: { plugins: [tailwindcss()] },
	redirects: {
		'/projects': '/work',
		'/blog': '/writing',
		'/coding': '/writing',
		'/tags': '/writing',
		'/categories': '/writing',
	},
})
