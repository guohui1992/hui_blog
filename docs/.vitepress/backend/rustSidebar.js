import { walk } from "../scripts/utils";
const baseDir = './docs/views/backend/rust/'
export const rustSidebar = [
	walk(baseDir,'环境搭建'),
	walk(baseDir,'基础通学'),
	walk(baseDir,'项目演练'),
]
