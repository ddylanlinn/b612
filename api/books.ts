type NotionProperty = {
	type?: string
	title?: Array<{ plain_text?: string }>
	rich_text?: Array<{ plain_text?: string }>
	url?: string | null
	select?: { name?: string } | null
	status?: { name?: string } | null
	date?: { start?: string } | null
	number?: number | null
	files?: Array<{ external?: { url?: string }; file?: { url?: string } }>
}

type NotionPage = {
	id: string
	properties?: Record<string, NotionProperty>
}

const palettes = ['#744137', '#84603a', '#374f4a', '#6f3c50', '#4c4463', '#8a4f37', '#52533f']

function plainText(property?: NotionProperty) {
	const fragments = property?.type === 'title' ? property.title : property?.rich_text
	return fragments?.map((fragment) => fragment.plain_text ?? '').join('').trim() ?? ''
}

function coverUrl(property?: NotionProperty) {
	if (property?.url) return property.url
	const file = property?.files?.[0]
	return file?.external?.url ?? file?.file?.url ?? null
}

function paletteFor(id: string) {
	const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)
	return palettes[hash % palettes.length]
}

function normalizeBook(page: NotionPage) {
	const properties = page.properties ?? {}
	const isbnProperty = properties.ISBN
	const isbn = plainText(isbnProperty) || (isbnProperty?.number == null ? '' : String(isbnProperty.number))
	return {
		id: page.id,
		title: plainText(properties.Title) || '未命名書籍',
		author: plainText(properties.Author) || '未註明',
		isbn,
		cover: coverUrl(properties.Cover),
		status: properties.Status?.select?.name ?? properties.Status?.status?.name ?? '未註明',
		addedAt: properties['Added At']?.date?.start ?? null,
		rating: properties.Rating?.number ?? null,
		finishedAt: properties['Finished At']?.date?.start ?? null,
		palette: paletteFor(page.id),
	}
}

async function queryBooks(token: string, dataSourceId: string) {
	const pages: NotionPage[] = []
	let cursor: string | undefined

	do {
		const response = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				'Notion-Version': '2025-09-03',
			},
			body: JSON.stringify({
				page_size: 100,
				...(cursor ? { start_cursor: cursor } : {}),
			}),
		})

		if (!response.ok) throw new Error(`Notion returned ${response.status}`)
		const payload = await response.json() as {
			results?: NotionPage[]
			has_more?: boolean
			next_cursor?: string | null
		}
		pages.push(...(payload.results ?? []))
		cursor = payload.has_more && payload.next_cursor ? payload.next_cursor : undefined
	} while (cursor)

	return pages
		.map(normalizeBook)
		.sort((a, b) => (a.addedAt && b.addedAt ? b.addedAt.localeCompare(a.addedAt) : 0))
}

async function handleRequest(request: Request) {
	if (request.method !== 'GET') {
		return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } })
	}

	const token = process.env.NOTION_TOKEN
	const dataSourceId = process.env.NOTION_BOOKS_DATA_SOURCE_ID
	if (!token || !dataSourceId) {
		return Response.json(
			{ error: 'Bookshelf is not configured.' },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } },
		)
	}

	try {
		const books = await queryBooks(token, dataSourceId)
		return Response.json(
			{ books, updatedAt: new Date().toISOString() },
			{ headers: { 'Cache-Control': 'no-store' } },
		)
	} catch (error) {
		console.error('[bookshelf] Notion query failed', error)
		return Response.json(
			{ error: 'Bookshelf data is temporarily unavailable.' },
			{ status: 502, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}

export default { fetch: handleRequest }
