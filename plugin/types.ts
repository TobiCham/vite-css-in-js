import type { NodePath, TransformOptions } from "@babel/core"
import type { TaggedTemplateExpression } from "@babel/types"
import type { Middleware } from "stylis"

export interface CssImportPluginOptions {
	cache?: CssCache
	classNameGenerator?: ClassNameGenerator
	fileFilter?: (fileId: string, code: string) => boolean
	packageName?: string
	importName?: string
	stylisPlugins?: Middleware[]
	loadIdentifier?: string
	babelOptions?: TransformOptions
}

export interface CssCache {
	addCssCache(entry: CssCacheEntry): void
	getCssCache(className: string): string | null
	clearCache(filePath: string): void
}

export interface CssCacheEntry {
	filePath: string
	content: string
	className: string
}

export interface ClassNameGenerator {
	generateClassName(properties: ClassNameGenerationProperties): string
}

export interface ClassNameGenerationProperties {
	css: string
	filePath: string
	babelPath: NodePath<TaggedTemplateExpression>
	variableName: string | null
}
