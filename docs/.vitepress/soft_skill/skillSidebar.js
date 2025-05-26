import { walk } from "../scripts/utils";
const baseDir = './docs/views/soft_skill/'
export const skillSidebar = [
	walk(baseDir,'个人成长'),
	walk(baseDir,'精选文章'),
]
