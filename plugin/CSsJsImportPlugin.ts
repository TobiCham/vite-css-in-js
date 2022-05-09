import { transformSync } from "@babel/core"
import { stringify } from "stylis"
import type { Plugin } from "vite"
import { createCSSJSBabelPlugin } from "./CssInJsBabelPlugin"
import { DefaultClassNameGenerator } from "./DefaultClassNameGenerator"
import { DefaultCssCache } from "./DefaultCssCache"
import type { CssImportPluginOptions } from "./types"

export const createDefaultFileFilter = (importName: string) => (fileId: string, code: string) => {
	if (!/.*\.(jsx|tsx|js|ts)$/.test(fileId)) {
		return false
	}
	if (fileId.includes("node_modules") || !code.includes(importName)) {
		return false
	}
	return true
}

export const optionsWithDefaults = (options: CssImportPluginOptions): Required<CssImportPluginOptions> => {
	const {
		packageName = "vite-css-in-js",
		importName = "css",
		loadIdentifier = "vite-css-in-js@",
		fileFilter = createDefaultFileFilter(importName),
		cache = new DefaultCssCache(),
		classNameGenerator = new DefaultClassNameGenerator(),
		stylisPlugins = [stringify],
		babelOptions = {},
	} = options

	return {
		importName,
		packageName,
		fileFilter,
		loadIdentifier,
		cache,
		classNameGenerator,
		stylisPlugins,
		babelOptions,
	}
}

export const createCSSJSImportPlugin = (options: CssImportPluginOptions = {}): Plugin => {
	const parsedOptions = optionsWithDefaults(options)
	const { fileFilter, cache, loadIdentifier, babelOptions } = parsedOptions

	return {
		name: "css-in-js",
		resolveId(id) {
			if (id.startsWith(loadIdentifier) && id.endsWith(".css")) {
				return "\0" + id
			}
		},
		load(id) {
			const search = "\0" + loadIdentifier
			if (id.startsWith(search) && id.endsWith(".css")) {
				const className = id.substring(search.length, id.length - 4)
				const cssResult = cache.getCssCache(className)
				if (cssResult) {
					return cssResult
				}
			}
		},
		transform(code, id) {
			if (!fileFilter(id, code)) {
				return
			}

			const babelResult = transformSync(code, {
				...babelOptions,
				filename: id,
				plugins: [...(babelOptions.plugins ?? []), createCSSJSBabelPlugin(id, parsedOptions)],
			})

			if (!babelResult) {
				return
			}

			return {
				code: babelResult.code ?? "",
				map: babelResult.map,
			}
		},
		watchChange(id, { event }) {
			if (event === "delete") {
				cache.clearCache(id)
			}
		},
	}
}
