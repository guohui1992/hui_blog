import {walk} from "../scripts/utils";
// 页面左侧大目录
const baseDir = './docs/views/backend/nestjs/'
export const nestjsSidebar = [
	walk(baseDir,'NestJS基础'),//左侧文章分类
	walk(baseDir,'NestJS进阶'),
	walk(baseDir,'安全认证'),
]
