import type { CssCache, CssCacheEntry } from "./types"

export class DefaultCssCache implements CssCache {
	private fileCache: Record<string, CssCacheEntry[]> = {}
	private cssClassNameCache: Record<string, CssCacheEntry[]> = {}

	addCssCache(entry: CssCacheEntry): void {
		this.addEntry(this.fileCache, entry.filePath, entry)
		this.addEntry(this.cssClassNameCache, entry.className, entry)
	}

	private addEntry(record: Record<string, CssCacheEntry[]>, key: string, entry: CssCacheEntry) {
		let result = record[key]
		if(result === undefined) {
			result = []
			record[key] = result
		}
		result.push(entry)
	}

	getCssCache(className: string): string | null {
		const entries = this.cssClassNameCache[className]
		if(!entries || entries.length === 0) {
			return null
		}
		return entries[0].content
	}

	clearCache(filePath: string): void {
		const entries = this.fileCache[filePath]
		delete this.fileCache[filePath]

		if (!entries) {
			return
		}
		for (const entry of entries) {
			const classNameEntries = this.cssClassNameCache[entry.className]
			if (classNameEntries) {
				this.cssClassNameCache[entry.className] = classNameEntries.filter(e => e.filePath !== filePath)
			}
		}
		entries.forEach((entry) => delete this.cssClassNameCache[entry.className])
	}
}
