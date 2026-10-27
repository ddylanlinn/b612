export type Topic = 'Work' | 'Outdoors' | 'Travel' | 'Life'

export const articleMeta: Record<string, { topic: Topic; summary: string; featured?: boolean }> = {
	'atlas-shrugged': { topic: 'Life', summary: 'Notes on individualism, self-interest, freedom, and responsibility after reading Ayn Rand.', featured: true },
	'auschwitz': { topic: 'Travel', summary: 'A visit to Auschwitz and a reflection on the ordinary machinery behind mass violence.' },
	'boycott': { topic: 'Life', summary: 'A closer look at boycotts as personal choice, collective action, and moral expression.' },
	'brave-new-world': { topic: 'Life', summary: 'Reading Brave New World changed how I thought about freedom, stability, and utopia.' },
	'camino-backpack-weight': { topic: 'Travel', summary: 'What the weight of a backpack reveals about needs, limits, and choices on a long walk.' },
	'camino-book-publish': { topic: 'Life', summary: 'The story behind publishing a book drawn from an 800-kilometre walk across Spain.', featured: true },
	'camino-intro': { topic: 'Travel', summary: 'An introduction to the Camino de Santiago and the many ways people choose to complete it.', featured: true },
	'camino-language-thinking': { topic: 'Life', summary: 'How language shapes the structures we use to think and understand other cultures.' },
	'camino-pirineos': { topic: 'Travel', summary: 'Crossing the Pyrenees on the first demanding stage of the Camino de Santiago.' },
	'camino-travel-meaning': { topic: 'Travel', summary: 'A reflection on the line between passing through a place and learning to live in it.' },
	'climate-greta': { topic: 'Life', summary: 'Reconsidering Greta Thunberg and the influence one persistent voice can have.' },
	'environmental-protection': { topic: 'Life', summary: 'Why visible acts such as reducing plastic are only one part of environmental responsibility.' },
	'exploration-nakanosen-imusu-ivahu': { topic: 'Outdoors', summary: 'Field notes from exploring a historic mountain route along Taiwan’s Junda River.', featured: true },
	'mountain-is-there': { topic: 'Outdoors', summary: 'Why people return to the mountains despite discomfort, fatigue, and risk.' },
	'mountain-social-events-education': { topic: 'Outdoors', summary: 'What recent mountain incidents reveal about access, preparation, and outdoor education.' },
	'mt-fuji-crowd': { topic: 'Outdoors', summary: 'A crowded Mount Fuji ascent and the tension between access, tourism, and wilderness.' },
	'orchid-island': { topic: 'Travel', summary: 'Observations on tourism, cultural change, and environmental pressure on Orchid Island.' },
	'outdoor-personality': { topic: 'Outdoors', summary: 'A playful comparison of the personalities drawn to different outdoor activities.' },
	'taipei-marathon-2019': { topic: 'Outdoors', summary: 'Going from no running experience to a first 42-kilometre marathon in two months.', featured: true },
	'through-the-language-glass': { topic: 'Life', summary: 'Notes on how language can shape orientation, perception, and our picture of reality.' },
	'unschooling-kayak-sailing': { topic: 'Life', summary: 'A hand-built kayak journey and what self-directed education can look like in practice.' },
	'vast-interview': { topic: 'Life', summary: 'An interview about work, travel, outdoor life, and finding a less conventional path.' },
	'yangmingshan-dayoukeng': { topic: 'Outdoors', summary: 'Following an old sulphur-carrying trail into the industrial history of Yangmingshan.', featured: true },
}

export function metaFor(slug: string) {
	const meta = articleMeta[slug]
	if (!meta) throw new Error(`Missing navigation metadata for ${slug}`)
	return meta
}
