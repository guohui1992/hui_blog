import {htmlSidebar} from "./frontend/htmlSidebar";
import {cssSidebar} from "./frontend/cssSidebar";
import {skillSidebar} from "./soft_skill/skillSidebar";
import {nestjsSidebar} from "./backend/nestjsSiderbar";
import {colorfulSidebar} from "./colorfulLife/colorfulSiderbar";
import { nginxSidebar } from "./backend/nginxSidebar";
import {bigManSidebar} from "./bigMan/bigManSiderbar";
import {bugSidebar} from "./bug/bugSiderbar";
import {frontendNav} from "./frontend";
import {backendNav} from "./backend";
import {gitSidebar} from "./backend/gitSidebar";


export default {
	base: '/hui_blog/',
	outDir: 'dist',
	title: '疾风浴雪的花园',
	description: 'Talk is cheap, show me your code.',
	themeConfig: {
		siteTitle: '疾风浴雪',
		logo: '/img/moon.jpg',
		nav: [
			{
				text: '首页',
				link: '/index',
			},
			frontendNav,
			// backendNav,
			{
				text: '巨人的肩膀',
				link: '/bigMan/',
			},
			// {
			// 	text: 'bug集中营',
			// 	link: '/bug/',
			// },
			{
				text: '软实力',
				link: '/soft_skill/',
			},
		],
		sidebar: {
			// 前端
			'/views/frontend/html/': htmlSidebar,
			'/views/frontend/css/': cssSidebar,
			// 后端
			'/views/backend/nestjs/': nestjsSidebar,
			'/views/backend/nginx/': nginxSidebar,
			'/views/backend/gitLearn/': gitSidebar,
			// 巨人的肩膀
			'/bigMan/': bigManSidebar,
			// bug集中营
			'/bug/': bugSidebar,
			// 缤纷世界
			'/views/soft_skill/': skillSidebar,
		},

		socialLinks: [
			{icon: 'github', link: 'https://github.com/guohui1992/hui_blog'},
		]

	}

}
