export const backendNav={
	text: '后端',
	activeMatch: '/views/backend/',
	items: [
		{
			text: '框架',
			items:[
				{text: 'NestJS', link:'/views/backend/nestjs/'},
				{text: 'Rust', link:'/views/backend/rust/'},
			]
		},
		{
			text: '服务',
			items:[
				{text: 'Nginx', link:'/views/backend/nginx/'},
				{text: 'Git', link:'/views/backend/gitLearn/'},
			]
		},
	]
}
