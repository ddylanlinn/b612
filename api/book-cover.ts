const googleBooksHosts = new Set(['books.google.com', 'books.googleusercontent.com'])
const allowedHosts = new Set([
	...googleBooksHosts,
	'cdn.kobo.com',
	'cdnec.sanmin.com.tw',
	'www.crown.com.tw',
	'cdn-booklife.shang-yu.com',
	'www.suncolor.com.tw',
	'd4dpzjhk0g50s.cloudfront.net',
])
const maxCoverBytes = 2_000_000
const maxRedirects = 3
const allowedContentTypes = new Set(['image/avif', 'image/bmp', 'image/gif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

class CoverProxyError extends Error {
	readonly upstreamStatus?: number

	constructor(message: string, upstreamStatus?: number) {
		super(message)
		this.name = 'CoverProxyError'
		this.upstreamStatus = upstreamStatus
	}
}

function allowedCoverUrl(value: string | null, base?: URL) {
	if (!value) return null
	try {
		const url = base ? new URL(value, base) : new URL(value)
		if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.has(url.hostname)) return null
		if (googleBooksHosts.has(url.hostname) && url.pathname !== '/books/content') return null
		return url
	} catch {
		return null
	}
}

function loggableSource(value: string | null) {
	if (!value) return null
	try {
		const url = new URL(value)
		return `${url.origin}${url.pathname}`
	} catch {
		return null
	}
}

async function fetchCover(url: URL, redirectsLeft = maxRedirects): Promise<Response> {
	const headers: Record<string, string> = { Accept: 'image/avif,image/webp,image/*' }
	// Cite's CloudFront distribution rejects cover requests without its storefront referrer.
	if (url.hostname === 'd4dpzjhk0g50s.cloudfront.net') headers.Referer = 'https://www.cite.com.tw/'

	const response = await fetch(url, {
		headers,
		redirect: 'manual',
	})
	if (![301, 302, 303, 307, 308].includes(response.status)) return response

	const redirectUrl = allowedCoverUrl(response.headers.get('location'), url)
	if (!redirectUrl || redirectsLeft === 0) {
		throw new CoverProxyError('Cover redirect is not allowed.', response.status)
	}
	await response.body?.cancel()
	return fetchCover(redirectUrl, redirectsLeft - 1)
}

async function readCoverBody(response: Response) {
	if (!response.body) throw new CoverProxyError('Cover response has no body.', response.status)

	const reader = response.body.getReader()
	const chunks: Uint8Array[] = []
	let totalBytes = 0

	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		totalBytes += value.byteLength
		if (totalBytes > maxCoverBytes) {
			await reader.cancel()
			throw new CoverProxyError(`Cover exceeds ${maxCoverBytes} bytes.`, response.status)
		}
		chunks.push(value)
	}

	const body = new Uint8Array(totalBytes)
	let offset = 0
	for (const chunk of chunks) {
		body.set(chunk, offset)
		offset += chunk.byteLength
	}
	return body
}

async function handleRequest(request: Request) {
	if (request.method !== 'GET') {
		return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'GET' } })
	}

	const requestedUrl = new URL(request.url).searchParams.get('url')
	const source = allowedCoverUrl(requestedUrl)
	if (!source) {
		console.warn('[bookshelf] Cover proxy rejected', {
			status: 400,
			reason: 'Invalid or unapproved cover URL.',
			source: loggableSource(requestedUrl),
		})
		return Response.json({ error: 'Invalid cover URL.' }, { status: 400 })
	}

	try {
		const response = await fetchCover(source)
		const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
		const contentLengthHeader = response.headers.get('content-length')
		const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null
		if (!response.ok) throw new CoverProxyError(`Cover upstream returned ${response.status}.`, response.status)
		if (!contentType || !allowedContentTypes.has(contentType)) {
			throw new CoverProxyError(`Cover returned invalid Content-Type: ${contentType ?? 'missing'}.`, response.status)
		}
		if (contentLength !== null && (!Number.isFinite(contentLength) || contentLength > maxCoverBytes)) {
			throw new CoverProxyError(`Cover Content-Length is invalid: ${contentLengthHeader}.`, response.status)
		}

		const body = await readCoverBody(response)
		return new Response(body, {
			headers: {
				'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
				'Content-Type': contentType,
				'X-Content-Type-Options': 'nosniff',
			},
		})
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error)
		const upstreamStatus = error instanceof CoverProxyError ? error.upstreamStatus : undefined
		console.error('[bookshelf] Cover proxy failed', {
			status: 502,
			upstreamStatus,
			reason,
			source: loggableSource(source.toString()),
		})
		return Response.json(
			{ error: 'Book cover is temporarily unavailable.', upstreamStatus },
			{ status: 502, headers: { 'Cache-Control': 'no-store' } },
		)
	}
}

export default { fetch: handleRequest }
