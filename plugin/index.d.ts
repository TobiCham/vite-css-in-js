import type { Plugin } from "vite"

export interface CssImportPluginOptions {
	fileFilter?: (fileId: string, code: string) => boolean
}

export function createCSSJSImportPlugin(options?: CssImportPluginOptions): Plugin