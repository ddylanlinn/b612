import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const contentRoot = join(root, 'src/content')
const publicRoot = join(root, 'public')
const metadataSource = readFileSync(join(root, 'src/data/articleMeta.ts'), 'utf8')
const failures = []

function filesIn(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name)
		return entry.isDirectory() ? filesIn(path) : [path]
	})
}

const contentFiles = filesIn(contentRoot).filter((file) => ['.md', '.mdx'].includes(extname(file)))
const publishedBlogSlugs = []
const internalLinks = []

for (const file of contentFiles) {
	const source = readFileSync(file, 'utf8')
	const name = relative(root, file)
	const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)
	if (!frontmatter) { failures.push(`${name}: missing frontmatter`); continue }
	for (const field of ['title', 'date', 'draft', 'summary']) {
		if (!new RegExp(`^${field}:`, 'm').test(frontmatter[1])) failures.push(`${name}: missing ${field}`)
	}
	if (/\bTODO\b|placeholder/i.test(source)) failures.push(`${name}: contains TODO or placeholder`)
	for (const [asset] of source.matchAll(/\/static\/[^)\s'"]+/g)) {
		if (!existsSync(join(publicRoot, asset))) failures.push(`${name}: missing asset ${asset}`)
	}
	for (const [, target] of source.matchAll(/\]\((\/[^)#\s]+)(?:#[^)]*)?\)/g)) internalLinks.push({ name, target })
	if (name.startsWith('src/content/blog/') && /^draft:\s*false\s*$/m.test(frontmatter[1])) {
		publishedBlogSlugs.push(relative(join(contentRoot, 'blog'), file).replace(/\.mdx?$/, ''))
	}
}

const unique = new Set(publishedBlogSlugs)
if (unique.size !== publishedBlogSlugs.length) failures.push('duplicate published blog slug')
if (publishedBlogSlugs.length !== 23) failures.push(`expected 23 published blog posts, found ${publishedBlogSlugs.length}`)
for (const slug of publishedBlogSlugs) {
	if (!metadataSource.includes(`'${slug}':`)) failures.push(`missing English navigation metadata for ${slug}`)
}
const validPagePaths = new Set(['/', '/work', '/writing', '/about', ...publishedBlogSlugs.map((slug) => `/blog/${slug}`)])
for (const { name, target } of internalLinks) {
	if (target.startsWith('/static/') || target.startsWith('/pdf/')) {
		if (!existsSync(join(publicRoot, target))) failures.push(`${name}: broken internal asset ${target}`)
	} else if (!validPagePaths.has(target.replace(/\/$/, ''))) {
		failures.push(`${name}: broken internal link ${target}`)
	}
}

if (failures.length) {
	console.error(failures.join('\n'))
	process.exit(1)
}
console.log(`Content validation passed: ${contentFiles.length} files, ${publishedBlogSlugs.length} published articles.`)
