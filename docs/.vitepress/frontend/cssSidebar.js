import { walk } from "../scripts/utils";
const baseDir = './docs/views/frontend/css/'
export const cssSidebar = [
	walk(baseDir,'基础知识'),
	walk(baseDir,'面试题')
]