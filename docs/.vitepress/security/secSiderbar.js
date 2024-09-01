import {walk} from "../scripts/utils";

const baseDir = './docs/sec/'
export const secSidebar = [
	walk(baseDir,'攻击类'),
	walk(baseDir,'密码学'),
]
