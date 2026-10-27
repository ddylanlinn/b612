type TimelineEntry = { period: string; title: string; detail?: string; href?: string }

export const timeline: TimelineEntry[] = [
	{ period: '2023 – now', title: 'Software Engineer, JKO Pay', detail: 'Product delivery, internal platforms, shared tooling, analytics, and monitoring.' },
	{ period: '2021 – 2023', title: 'Frontend Developer, Kiipo', detail: 'Frontend architecture and delivery for a medical research data platform.' },
	{ period: '2021', title: 'Published a book', detail: '《800公里的漫漫思辨：追尋自我ˍ朝聖手札》', href: '/blog/camino-book-publish' },
	{ period: '2020 – 2021', title: 'Learned software development', detail: 'A year-long full-stack program at Lidemy.' },
	{ period: '2019', title: 'Completed a first marathon', href: '/blog/taipei-marathon-2019' },
	{ period: '2018', title: 'Walked the Camino de Santiago', detail: 'About 800 kilometres across northern Spain.', href: '/blog/camino-intro' },
	{ period: 'Before 2020', title: 'Editorial and marketing work', detail: 'Content, projects, and events before moving into software.' },
	{ period: '2015', title: 'Tamkang University', detail: 'B.B.A. in Information Management.' },
]
