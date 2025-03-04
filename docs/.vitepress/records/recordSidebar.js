import {walk} from "../scripts/utils";

const baseDir = './docs/views/records/'
export const recordSidebar = [
	walk(baseDir,'杂记'),
	walk(baseDir,'服务器'),
]
