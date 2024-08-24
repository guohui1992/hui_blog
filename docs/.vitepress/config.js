import {htmlSidebar} from "./frontend/htmlSidebar";
import {cssSidebar} from "./frontend/cssSidebar";
import {skillSidebar} from "./soft_skill/skillSidebar";

import {nestjsSidebar} from "./backend/nestjsSiderbar";
import {colorfulSidebar} from "./colorfulLife/colorfulSiderbar";
import { nginxSidebar } from "./backend/nginxSidebar";
import {toolsSidebar} from "./tools/toolsSiderbar";
import {secSidebar} from "./security/secSiderbar";
import {devopsSidebar} from "./devops/devopsSiderbar";
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
			backendNav,
			{
				text: '工具',
				link: '/tools/',
			},
			{
				text: '安全学',
				link: '/sec/',
			},
			{
				text: '运维学',
				link: '/devOps/',
			},
			{
				text: '软实力',
				link: '/views/soft_skill/index',
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
			// 工具
			'/tools/': toolsSidebar,
			'/sec/': secSidebar,
			'/devOps/': devopsSidebar,
			// 软实力
			'/views/soft_skill/': skillSidebar,
		},

		socialLinks: [
			{icon: 'github', link: 'https://github.com/guohui1992/hui_blog'},
		]

	}

}
