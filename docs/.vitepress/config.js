import {htmlSidebar} from "./frontend/htmlSidebar";
import {cssSidebar} from "./frontend/cssSidebar";
import {reactSidebar} from "./frontend/reactSidebar";
import {skillSidebar} from "./soft_skill/skillSidebar";
import {internalSkillSidebar} from "./internal_skill/skillSidebar";

import {nestjsSidebar} from "./backend/nestjsSidebar";
import {rustSidebar} from "./backend/rustSidebar";
import {nginxSidebar } from "./backend/nginxSidebar";
import {toolsSidebar} from "./tools/toolsSidebar";
import {secSidebar} from "./security/secSidebar";
import {devopsSidebar} from "./devops/devopsSidebar";
import {frontendNav} from "./frontend";
import {backendNav} from "./backend";
import {gitSidebar} from "./backend/gitSidebar";
import {recordSidebar} from "./records/recordSidebar";


export default {
	base: '/',
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
				link: '/views/tools/index',
			},
			{
				text: '安全学',
				link: '/views/sec/index',
			},
			{
				text: '运维学',
				link: '/views/devOps/index',
			},
			{
				text: '软实力',
				link: '/views/soft_skill/index',
			},
			{
				text: '个人内功',
				link: '/views/internal_skill/index',
			},
			{
				text: '杂记',
				link: '/views/records/index',
			},
			
		],
		sidebar: {
			// 前端
			'/views/frontend/html/': htmlSidebar,
			'/views/frontend/css/': cssSidebar,
			'/views/frontend/react/': reactSidebar,
			// 后端
			'/views/backend/nestjs/': nestjsSidebar,
			'/views/backend/nginx/': nginxSidebar,
			'/views/backend/gitLearn/': gitSidebar,
			'/views/backend/rust/': rustSidebar,
			// 工具
			'/views/tools/': toolsSidebar,
			'/views/sec/': secSidebar,
			'/views/devOps/': devopsSidebar,
			// 软实力
			'/views/soft_skill/': skillSidebar,
			// 个人内功
			'/views/internal_skill/': internalSkillSidebar,
			// 杂记
			'/views/records/': recordSidebar,
		},

		socialLinks: [
			{icon: 'github', link: 'https://github.com/guohui1992/hui_blog'},
		]

	}

}
