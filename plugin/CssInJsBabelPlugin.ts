import type { NodePath, PluginObj } from "@babel/core"
import type { AssignmentExpression, AssignmentPattern, LVal, TaggedTemplateExpression, VariableDeclarator } from "@babel/types"
import { stringLiteral, importDeclaration } from "@babel/types"
import { compile, middleware, serialize } from "stylis"
import type { CssImportPluginOptions } from "./types"

const getVariableName = (val: LVal): string | null => {
	switch (val.type) {
		case "Identifier":
			return val.name
		case "MemberExpression":
			switch (val.property.type) {
				case "Identifier":
					return val.property.name
				case "PrivateName":
					return val.property.id.name
			}
	}
	return null
}

const getVariableNameFor = (templatePath: NodePath<TaggedTemplateExpression>): string | null => {
	const parent = templatePath.parent
	if (!parent) {
		return null
	}
	switch (parent.type) {
		case "VariableDeclarator":
			return getVariableName((parent as VariableDeclarator).id)
		case "AssignmentExpression":
			return getVariableName((parent as AssignmentExpression).left)
		case "AssignmentPattern":
			return getVariableName((parent as AssignmentPattern).left)
	}

	return null
}

export const createCSSJSBabelPlugin = (filePath: string, options: Required<CssImportPluginOptions>): PluginObj => {
	let importsToAdd: string[] = []

	return {
		name: "Vite CSS in JS",
		visitor: {
			Program: {
				enter() {
					importsToAdd = []
					options.cache.clearCache(filePath)
				},
				exit(path) {
					path.traverse({
						ImportDeclaration(path) {
							const node = path.node

							if (node.source.value !== options.packageName) {
								return
							}

							const index = node.specifiers.findIndex((s) => {
								if (s.type !== "ImportSpecifier") {
									return false
								}
								switch (s.imported.type) {
									case "Identifier":
										return s.imported.name === options.importName
									case "StringLiteral":
										return s.imported.type === options.importName
								}
								return false
							})
							if (index >= 0) {
								path.insertAfter(importsToAdd.map((importName) => importDeclaration([], stringLiteral(importName))))

								//Clear to avoid duplicate imports in case of duplicate { css } imports
								importsToAdd = []

								const importedPath = path.get(`specifiers.${index}`)
								if (importedPath instanceof Array) {
									importedPath.forEach((p) => p.remove())
								} else {
									importedPath.remove()
								}

								if (path.node.specifiers.length === 0) {
									path.remove()
								}
							}
						},
					})
				},
			},
			TaggedTemplateExpression(path) {
				if (!path.get("tag").referencesImport(options.packageName, options.importName)) {
					return
				}
				const node = path.node
				if (node.quasi.expressions.length !== 0) {
					throw (path.get("quasi.expressions.0") as NodePath).buildCodeFrameError("Must not include expressions within css template string")
				}
				if (node.quasi.quasis.length !== 1) {
					throw path.buildCodeFrameError("No css string found")
				}

				let styleCode
				try {
					styleCode = serialize(compile(node.quasi.quasis[0].value.raw), middleware(options.stylisPlugins))
				} catch (e) {
					throw path.buildCodeFrameError((e as Error).message)
				}

				const className = options.classNameGenerator.generateClassName({
					babelPath: path,
					css: styleCode,
					filePath,
					variableName: getVariableNameFor(path),
				})

				let compiledCss
				try {
					const compiled = compile(`.${className}{${node.quasi.quasis[0].value.raw}}`)
					compiledCss = serialize(compiled, middleware(options.stylisPlugins))

					if (compiledCss.length === 0) {
						compiledCss = `.${className}{}`
					}
				} catch (e) {
					throw path.buildCodeFrameError((e as Error).message)
				}

				importsToAdd.push(options.loadIdentifier + className + ".css")
				options.cache.addCssCache({
					className,
					filePath,
					content: compiledCss,
				})

				path.replaceWith(stringLiteral(className))
			},
		},
	}
}
