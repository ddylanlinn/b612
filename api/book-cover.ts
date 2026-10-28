const allowedHosts = new Set(['books.google.com', 'books.googleusercontent.com'])
const maxCoverBytes = 2_000_000
const maxRedirects = 3

function allowedCoverUrl(value: string | null, base?: URL) {
	if (!value) return null
	try {
		const url = base ? new URL(value, base) : new URL(value)
		if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname) || url.pathname !== '/books/content') return null
		return url
	} catch {
		return null
	}
}

async function fetchCover(url: URL, redirectsLeft = maxRedirects): Promise<Response> {
	const response = await fetch(url, {
		headers: { Accept: 'image/avif,image/webp,image/*' },
		redirect: 'manual',
	})
	if (![301, 302, 303, 307, 308].includes(response.status)) return response

	const redirectUrl = allowedCoverUrl(response.headers.get('location'), url)
	if (!redirectUrl || redirectsLeft === 0) throw new Error('Cover redirect is not allowed.')
	return fetchCover(redirectUrl, redirectsLeft - 1)
}

async function handleRequest(request: Request) {
	if (request.method !== 'GET') {
		return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } })
	}

	const source = allowedCoverUrl(new URL(request.url).searchParams.get('url'))
	if (!source) return Response.json({ error: 'Invalid cover URL.' }, { status: 400 })

	try {
		const response = await fetchCover(source)
		const contentType = response.headers.get('content-type')?.split(';', 1)[0]
		const contentLength = Number(response.headers.get('content-length') ?? 0)
		if (!response.ok || !contentType?.startsWith('image/') || contentLength > maxCoverBytes) {
			throw new Error(`Cover returned ${response.status}.`)
		}

		const body = await response.arrayBuffer()
		if (body.byteLength > maxCoverBytes) throw new Error('Cover is too large.')
		return new Response(body, {
			headers: {
				'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
				'Content-Type': contentType,
				'X-Content-Type-Options': 'nosniff',
			},
		})
	} catch (error) {
		console.error('[bookshelf] Cover proxy failed', error)
		return Response.json(
			{ error: 'Book cover is temporarily unavailable.' },
			{ status: 502, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}

export default { fetch: handleRequest }
