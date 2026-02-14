/**
 * Detect language from content
 */
export function detectLanguage(content: string): string {
	const trimmed = content.trim();

	// JSON detection
	if (
		(trimmed.startsWith("{") && trimmed.endsWith("}")) ||
		(trimmed.startsWith("[") && trimmed.endsWith("]"))
	) {
		try {
			JSON.parse(trimmed);
			return "json";
		} catch {
			// Not valid JSON
		}
	}

	// HTML detection
	if (
		trimmed.match(/^<!DOCTYPE\s+html/i) ||
		trimmed.match(/^<html/i) ||
		trimmed.match(/<head|<body|<div|<span|<p>/i)
	) {
		return "html";
	}

	// XML detection
	if (
		trimmed.startsWith("<?xml") ||
		(trimmed.startsWith("<") && trimmed.includes("xmlns"))
	) {
		return "xml";
	}

	// CSS detection
	if (
		trimmed.match(/^[.#]?[\w-]+\s*\{[\s\S]*\}/) ||
		trimmed.match(/@media|@keyframes|@import/)
	) {
		return "css";
	}

	// YAML detection - stricter to avoid false positives with Markdown
	if (
		(trimmed.startsWith("---") || // Frontmatter
			(trimmed.match(/^[\w-]+:\s.+$/m) && trimmed.match(/^[\w-]+:\s.+$/m)!.length > 0)) && // Key-value pairs
		!trimmed.includes("{") &&
		!trimmed.includes(";") &&
		!trimmed.startsWith("#") // Markdown headers
	) {
		// Check for multiple key-value pairs to be sure, or explicit --- start
		if (trimmed.startsWith("---")) return "yaml";
		
		const lines = trimmed.split('\n');
		const kvCount = lines.filter(l => l.match(/^[\w-]+:\s.+$/)).length;
		if (kvCount >= 2) return "yaml";
	}

	// TOML detection
	if (trimmed.match(/^\[[\w-]+\]/m) && trimmed.match(/^[\w-]+\s*=/m)) {
		return "toml";
	}

	// Python detection
	if (
		trimmed.match(
			/^def\s+\w+\s*\(|^import\s+\w+|^from\s+\w+\s+import|^class\s+\w+/m,
		)
	) {
		return "python";
	}

	// JavaScript/TypeScript detection
	if (trimmed.match(/^(const|let|var|function|export|import)\s/m)) {
		if (
			trimmed.includes(": ") &&
			(trimmed.includes("interface ") || trimmed.includes("type "))
		) {
			return "typescript";
		}
		return "javascript";
	}

	// SQL detection
	if (trimmed.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i)) {
		return "sql";
	}

	// Bash detection
	if (
		trimmed.match(/^#!/) ||
		trimmed.match(/^\$\s+/m) ||
		trimmed.match(/^(echo|cd|ls|mkdir|rm|cat|grep|chmod)\s/m)
	) {
		return "bash";
	}

	// C# detection
	if (
		trimmed.match(
			/^(using\s+System|namespace\s+[\w.]+|public\s+(class|interface|enum))/m,
		)
	) {
		return "csharp";
	}

	// Java detection
	if (
		trimmed.match(/^(package\s+[\w.]+|public\s+class\s+\w+|import\s+java\.)/m)
	) {
		return "java";
	}

	// PHP detection
	if (trimmed.startsWith("<?php") || trimmed.match(/^\$\w+\s*=/m)) {
		return "php";
	}

	// Go detection
	if (
		trimmed.match(/^package\s+\w+|^func\s+(\(\w+\s+\*?\w+\)\s*)?\w+\s*\(/m)
	) {
		return "go";
	}

	// Rust detection
	if (trimmed.match(/^(fn\s+\w+|let\s+mut|impl\s+\w+|use\s+std::)/m)) {
		return "rust";
	}

	// C++ detection
	if (
		trimmed.match(
			/^(#include\s*<|namespace\s+\w+|class\s+\w+\s*{|int\s+main\s*\()/m,
		)
	) {
		return "cpp";
	}

	// Ruby detection
	if (trimmed.match(/^(def\s+\w+|require\s+['"]|class\s+\w+|end\s*$)/m)) {
		return "ruby";
	}

	// Default to markdown
	return "markdown";
}
