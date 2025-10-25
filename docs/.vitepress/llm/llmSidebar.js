import { walk } from "../scripts/utils";
const baseDir = './docs/views/llm/'

export const llmSidebar = [
  walk(baseDir, 'agent'),
]
