export * from "./CssInJsBabelPlugin"
export * from "./CSsJsImportPlugin"
export * from "./DefaultCssCache"
export * from "./DefaultClassNameGenerator"
export * from "./types"

export function css(template: TemplateStringsArray): string {
	throw new Error("Unable to import {css} from 'vite-css-in-js' directly, please configure the Vite plugin")
}
