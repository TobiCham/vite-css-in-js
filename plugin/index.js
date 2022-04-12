const { transformSync } = require("@babel/core")
const { addSideEffect } = require("@babel/helper-module-imports")
const { compile, serialize, stringify, middleware, prefixer } = require("stylis")
const t = require("@babel/types")

const chars = [..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"]

const PACKAGE_NAME = "vite-css-in-js"
const IMPORT_NAME = "css"

const prefix = "@vite-css-in-js_"

const babelPlugin = (classNameCache, codeCache) => () => {
	/**
	 * @type {babel.PluginObj}
	 */
	const importsToAdd = []

	const result = {
		visitor: {
			Program: {
				exit(path) {
					for(let i = importsToAdd.length - 1; i >= 0; i--) {
						const { path, name } = importsToAdd[i]
						addSideEffect(path, name)
					}
					path.traverse({
						ImportDeclaration(path) {
							/**
							 * @type {import("babel-types").ImportDeclaration}
							 */
							const node = path.node
							if(node.source.value === PACKAGE_NAME) {
								const index = node.specifiers.findIndex(s => s.imported.name === IMPORT_NAME)
								if(index >= 0) {
									const importedPath = path.get(`specifiers.${index}`);
									importedPath.remove()

									if(path.node.specifiers.length === 0) {
										path.remove()
									}
								}
							}
						},
					})
				}
			},
			TaggedTemplateExpression(path) {
				/**
				 * @type {import("babel-types").TaggedTemplateExpression}
				 */
				const node = path.node
	
				const generateId = () => {
					while (true) {
						const uniqueId = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
						if (!(uniqueId in classNameCache)) {
							return uniqueId
						}
					}
				}
	
				if (path.get("tag").referencesImport(PACKAGE_NAME, IMPORT_NAME)) {
					if(node.quasi.expressions.length !== 0) {
						throw path.get("quasi.expressions.0").buildCodeFrameError("Must not include expressions within css template string")
					}
					if(node.quasi.quasis.length !== 1) {
						throw path.buildCodeFrameError("No css string found")
					}

					const styleCode = node.quasi.quasis[0].value.raw.replace("\n", "").trim()
					const existingClassName = codeCache[styleCode]
					if (existingClassName) {
						addSideEffect(path, prefix + existingClassName + ".css")
						path.replaceWith(t.stringLiteral(existingClassName))
					} else {
						const uniqueId = generateId()
						const compiled = compile(`.${uniqueId}{${node.quasi.quasis[0].value.raw}}`)
						const output = serialize(compiled, middleware([prefixer, stringify]))
	
						classNameCache[uniqueId] = output
						codeCache[styleCode] = uniqueId
	
						importsToAdd.push({
							path,
							name: prefix + uniqueId + ".css"
						})
						path.replaceWith(t.stringLiteral(uniqueId))
					}
				}
			},
		},
	}
	return result
}

const defaultFileFilter = (fileId, code) => {
	if (!/.*\.(jsx|tsx|js|ts)$/.test(fileId)) {
		return false
	}
	if(fileId.includes("node_modules") || !code.includes(IMPORT_NAME)) {
		return false;
	}
	return true
}

/**
 * @param {import(".").CssImportPluginOptions} options 
 * @returns {import("vite").Plugin}
 */
const createCSSJSImportPlugin = (options = {}) => {
	const {
		fileFilter = defaultFileFilter
	} = options

	const classNameCache = {}
	const codeCache = {}

	return {
		name: "css-in-js",
		resolveId(id) {
			if (id.startsWith(prefix) && id.endsWith(".css")) {
				return "\0" + id
			}
		},
		load(id) {
			const search = "\0" + prefix
			if (id.startsWith(search) && id.endsWith(".css")) {
				const uuid = id.substring(search.length, id.length - 4)
				const cssResult = classNameCache[uuid]
				if (cssResult) {
					return cssResult
				}
			}
		},
		transform(code, id) {
			if(!fileFilter(id, code)) {
				return
			}

			const babelResult = transformSync(code, {
				ast: true,
				plugins: [babelPlugin(classNameCache, codeCache)],
			})

			if (!babelResult) {
				return
			}

			return {
				code: babelResult.code ?? "",
				map: babelResult.map,
			}
		},
	}
}

module.exports = {
	createCSSJSImportPlugin
}