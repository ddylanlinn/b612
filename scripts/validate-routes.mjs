import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const dist = join(root, 'dist')
const staticRoot = existsSync(join(dist, 'client')) ? join(dist, 'client') : dist
const manifest = readFileSync(join(root, '.claude/docs/personal-website-astro-2026-10-08/legacy-routes.txt'), 'utf8')
const publishedRoutes = manifest.split('\n').filter((line) => line.startsWith('/blog/') && !line.includes('*'))
const required = ['index.html', 'work/index.html', 'writing/index.html', 'about/index.html', 'bookshelf/index.html', '404.html', 'rss.xml', 'robots.txt', 'sitemap-index.xml']
for (const route of publishedRoutes) required.push(`${route.slice(1)}/index.html`)
required.push('coding/gcp-deployment/index.html', 'coding/nested-route/introducing-multi-part-posts-with-nested-routing/index.html')

const missing = required.filter((file) => !existsSync(join(staticRoot, file)))
const forbidden = ['api/comment', 'api/get-comments', 'api/get-comments-count', 'api/newsletter'].filter((route) => existsSync(join(staticRoot, route)))
const redirects = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).redirects ?? []
const redirectMap = {
	'/blog': '/writing', '/coding': '/writing', '/projects': '/work', '/tags': '/writing', '/categories': '/writing',
	'/blog/page/:path*': '/writing', '/tags/:path*': '/writing', '/categories/:path*': '/writing',
}
for (const [source, destination] of Object.entries(redirectMap)) {
	if (!redirects.some((redirect) => redirect.source === source && redirect.destination === destination && redirect.permanent === true)) missing.push(`redirect ${source}`)
}

if (missing.length || forbidden.length) {
	if (missing.length) console.error(`Missing routes:\n${missing.join('\n')}`)
	if (forbidden.length) console.error(`Forbidden API routes:\n${forbidden.join('\n')}`)
	process.exit(1)
}
console.log(`Route validation passed: ${publishedRoutes.length} legacy articles and ${required.length - publishedRoutes.length} required outputs.`)
