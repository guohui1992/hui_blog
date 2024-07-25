export const frontendNav = {
	text: '前端',
	activeMatch: '/views/frontend',
	items:[
		{
			text: '基本功',
			items:[
				{text: 'Html', link:'/views/frontend/html/'},
				{text: 'CSS', link:'/views/frontend/css/'},
				// {text: 'JavaScript', link:'/views/frontend/javascript/'},
				// {text: 'TypeScript', link:'/views/frontend/typescript/'},
			]
		},
		{
			text: '框架',
			items:[
				{text: 'React', link:'/views/frontend/react/'},
				{text: 'Vue', link:'/views/frontend/vue/'},
			]
		},
		// {
		// 	text: '丰富资源',
		// 	items:[
		// 		{text: '组件库', link:'/views/frontend/ui/'},
		// 	]
		// }
	]
}
