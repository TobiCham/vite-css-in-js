import type { ClassNameGenerationProperties, ClassNameGenerator } from "./types"
import createHash from "sha.js"

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"

export const defaultVariableEndings = ["styles", "style", "class", "className", "class-name", "css"]

export class DefaultClassNameGenerator implements ClassNameGenerator {
	private readonly length: number
	private readonly variableEndings: string[]

	constructor(length: number = 7, variableEndings: string[] = defaultVariableEndings) {
		if (length < 3) {
			throw new Error("Length can be at minimum 3")
		}
		if (length > 46) {
			throw new Error("Length can be at maximum 46")
		}
		this.length = length
		this.variableEndings = variableEndings
	}

	generateClassName(properties: ClassNameGenerationProperties): string {
		const extension = this.cssHash(properties.css + "/" + properties.filePath)
		if (properties.variableName) {
			return this.matchVariableName(properties.variableName) + "_" + extension
		}
		return extension
	}

	matchVariableName(variableName: string): string {
		const varLower = variableName.toLowerCase()

		for (const possibility of this.variableEndings) {
			if (varLower.endsWith(possibility.toLowerCase())) {
				return variableName.substring(0, variableName.length - possibility.length)
			}
		}
		return variableName
	}

	/**
	 * @param content Content to hash
	 * @returns A hash of the content formatted in a way safe for a CSS class name
	 */
	cssHash(content: string) {
		const hash = createHash("sha256")
		hash.update(content)

		const bin = hash.digest()

		const output = []

		/*
			The CSS spec allows [a-zA-Z][a-zA-Z0-9_-]* for regular class names
			Conveniently exactly 64 characters for the latter part, but only 56 characters for the initial character

			Takes the approach of using an initial 5 bits as the first character ([a-zA-F]), 
			then reverts back to using a base64 encoding for the remaining desired number of characters

			Number of permutations therefore is 32 * (64 ^ (len - 1))
		*/

		const ch1 = bin[0] & 0x1f
		output.push(chars[ch1])

		for (let i = 0; i < this.length - 1; i++) {
			const pos = Math.floor((i * 6 + 5) / 8)
			const stride = (i * 6 + 5) % 8

			const byteStart = bin[pos]
			const byteEnd = stride <= 2 ? byteStart : bin[pos + 1]

			const low = (byteStart >> stride) & 0x3f
			const high = stride <= 2 ? 0 : (byteEnd & ((0x1 << (stride - 2)) - 1)) << (8 - stride)

			output.push(chars[low | high])
		}

		return output.join("")
	}
}
