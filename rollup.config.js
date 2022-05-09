import typescript from "rollup-plugin-typescript2"
import dts from "rollup-plugin-dts"

export default [
	{
		input: "plugin/index.ts",
		plugins: [typescript(), dts()],
		output: {
			file: "dist/index.d.ts",
			format: "es",
		},
	},
	{
		input: "plugin/index.ts",
		plugins: [typescript()],
		output: [
			{
				file: "dist/index.js",
				format: "cjs",
			},
			{
				file: "dist/index.mjs",
				format: "es",
			},
		],
	},
]
