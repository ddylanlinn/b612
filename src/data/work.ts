export const workIntro =
	'I build software products and the systems teams use to deliver them. My work sits mainly in frontend engineering, with product, platform, tooling, and developer experience often part of the same problem.'

export const caseStudies = [
	{
		id: 'admin-platform',
		title: 'Internal admin platform',
		context: 'Business teams depended on engineers for recurring internal tools.',
		role: 'Designed and built a low-code platform around YAML configuration, shared templates, authentication, and role-based access.',
		change: '117+ projects have launched through the platform, giving business teams a way to manage routine operations with less engineering dependency.',
	},
	{
		id: 'tracking-library',
		title: 'Shared tracking library',
		context: 'Web and mobile projects needed a consistent way to define and maintain analytics events.',
		role: 'Built a shared TypeScript library that captures GTM dataLayer events, syncs them to Mixpanel, and supports project rules, third-party advertising, and A/B tests.',
		change: 'Projects can reuse one tracking approach instead of rebuilding integrations separately.',
	},
	{
		id: 'research-platform',
		title: 'Medical research data platform',
		context: 'Research teams needed real-time aggregation and remote monitoring in a web product maintained by a small team.',
		role: 'Led frontend development, worked on the React architecture, and introduced TypeScript, automated testing, CI/CD, and Sentry monitoring.',
		change: 'The team gained a more maintainable delivery path with automated checks and production visibility.',
	},
] as const

export const roles = [
	{ company: 'JKO Payment Co., Ltd.', title: 'Software Engineer', period: 'Aug 2023 – Present' },
	{ company: 'Kiipo Technology Co., Ltd.', title: 'Frontend Developer', period: 'Nov 2021 – Aug 2023' },
	{ company: 'Lidemy Program', title: 'Full-stack development program', period: 'Nov 2020 – Nov 2021' },
	{ company: 'Editorial and marketing work', title: 'Chief editor and marketing planner', period: 'Before software' },
] as const

export const contactLinks = [
	{ label: 'Email', href: 'mailto:ddylanlinn@gmail.com' },
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/dylan-ch-lin-012b76267' },
	{ label: 'GitHub', href: 'https://github.com/ddylanlinn' },
] as const

export const resumeLinks = [
	{ label: 'Résumé (English)', href: '/pdf/dylan-resume-en.pdf' },
	{ label: '履歷（中文）', href: '/pdf/dylan-resume-zhtw.pdf' },
] as const
